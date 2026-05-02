import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as XLSX from 'xlsx'
import { bookService } from '../services/bookService'
import Button from './ui/Button'
import Modal from './ui/Modal'
import Card from './ui/Card'
import Loading from './ui/Loading'
import AlertDialog from './ui/AlertDialog'
import ConfirmDialog from './ui/ConfirmDialog'
import { BookOpen, Upload, Trash2, AlertTriangle } from 'lucide-react'

const BulkBookManager = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('select') // select, upload, preview, confirm
  const [excelData, setExcelData] = useState([])
  const [validBooks, setValidBooks] = useState([])
  const [invalidBooks, setInvalidBooks] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef()
  const queryClient = useQueryClient()
  
  // Dialog states
  const [alertDialog, setAlertDialog] = useState({ open: false, title: '', message: '', type: 'info' })
  const [deleteAllDialog, setDeleteAllDialog] = useState(false)
  const [downloadFailedDialog, setDownloadFailedDialog] = useState({ open: false, failedBooks: [], message: '' })

  const bulkDeleteMutation = useMutation({
    mutationFn: ({ bookIds, deleteAll }) => bookService.bulkDelete(bookIds, deleteAll),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    }
  })

  const bulkImportMutation = useMutation({
    mutationFn: (books) => bookService.bulkImport(books),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    }
  })

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        
        console.log('Available sheets:', workbook.SheetNames)
        
        // Read all sheets and combine data
        let allBooks = []
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName]
          
          // Read from row 3 (index 2) where the real headers are
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            range: 2, // Start reading from row 3 (index 2)
            defval: '' // Default value for empty cells
          })
          
          console.log(`Sheet "${sheetName}": ${jsonData.length} rows after header at index 2`)
          
          // Debug: Log first row to see all column names
          if (jsonData.length > 0) {
            console.log(`First row columns:`, Object.keys(jsonData[0]))
            console.log(`First row data sample:`, jsonData[0])
          }
          
          // Filter out completely empty rows and add sheet name as category
          const validRows = jsonData.filter(row => {
            // Skip if no Title or Title is empty/whitespace
            const title = (row.Title || row.title || '').toString().trim()
            return title.length > 0
          }).map(row => ({
            ...row,
            categoryFromSheet: sheetName
          }))
          
          console.log(`Sheet "${sheetName}": ${validRows.length} valid rows with titles, category will be: "${sheetName.charAt(0).toUpperCase() + sheetName.slice(1)}"`)
          allBooks = [...allBooks, ...validRows]
        })

        console.log('Total valid books from all sheets:', allBooks.length)
        
        if (allBooks.length === 0) {
          setAlertDialog({
            open: true,
            title: 'No Valid Books Found',
            message: 'No valid books found in the Excel file. Please ensure your Excel has:\n\n• Headers at row 3\n• At least a Title column with data',
            type: 'warning'
          })
          setIsProcessing(false)
          return
        }

        setExcelData(allBooks)
        validateAndProcessData(allBooks)
        setStep('preview')
      } catch (error) {
        console.error('Error parsing Excel file:', error)
        setAlertDialog({
          open: true,
          title: 'File Parsing Error',
          message: 'Error parsing Excel file. Please check the file format and try again.',
          type: 'danger'
        })
      } finally {
        setIsProcessing(false)
      }
    }

    reader.readAsArrayBuffer(file)
  }

  const validateAndProcessData = (data) => {
    const bookMap = new Map() // To track duplicates by title+author
    const invalid = []
    let totalRows = 0
    let skippedRows = 0

    console.log('=== Starting Validation ===')
    console.log('Total rows to process:', data.length)

    data.forEach((row, index) => {
      totalRows++
      
      // Extract and trim all values
      const title = (row.Title || row.title || '').toString().trim()
      const author = (row.Author || row.author || '').toString().trim() || 'Unknown'
      const edition = (row.Edition || row.edition || '').toString().trim() || '-'
      
      // Handle price - support both numeric and text (like "donated", "gift", etc.)
      let price = 0
      let priceNote = ''
      const priceValue = row.Price || row.price || row['Price '] || row[' Price']
      
      if (index < 3) {
        console.log(`Row ${index + 1} raw price value:`, priceValue, typeof priceValue)
      }
      
      if (priceValue !== undefined && priceValue !== null && priceValue !== '') {
        const priceStr = priceValue.toString().trim()
        const parsedPrice = parseFloat(priceStr)
        
        if (!isNaN(parsedPrice) && parsedPrice > 0) {
          // It's a valid number - store as price
          price = parsedPrice
        } else if (priceStr.length > 0 && isNaN(parsedPrice)) {
          // It's text (like "donated", "gift", etc.) - store as note
          priceNote = priceStr
        }
      }
      
      const ddcNo = (row['DDC No'] || row.DDCNo || row.ddc || '').toString().trim()
      
      // Handle Sr.No - preserve it even if it's 0 or looks like a number
      let srNo = ''
      const srNoValue = row['Sr.No'] || row['Sr No'] || row.SrNo || row.srNo
      if (srNoValue !== undefined && srNoValue !== null && srNoValue !== '') {
        srNo = srNoValue.toString().trim()
      }
      
      // Handle category - USE SHEET NAME as category (sheet tabs are the categories)
      // Priority: categoryFromSheet (tab name) > Category column > 'Miscellaneous'
      let category = (row.categoryFromSheet || row.Category || row.category || 'Miscellaneous').toString().trim()
      
      // Capitalize first letter for better display (backend does case-insensitive matching)
      category = category.charAt(0).toUpperCase() + category.slice(1)
      
      const byPurchase = (row['By Purchase'] || row.byPurchase || '').toString().trim()
      
      // Debug logging for first few rows
      if (index < 3) {
        console.log(`Row ${index + 1}:`)
        console.log(`  - Title: "${title}"`)
        console.log(`  - Category: "${category}"`)
        console.log(`  - Sr.No: "${srNo}"`)
        console.log(`  - Price (numeric): ${price}`)
        console.log(`  - Price Note (text): "${priceNote}"`)
        console.log(`  - Edition: "${edition}"`)
      }
      
      // Skip if no title (should already be filtered, but double-check)
      if (!title) {
        skippedRows++
        return
      }
      
      // Generate ISBN: sheetName-srNo-ddcNo
      const isbnParts = [
        category.replace(/[^a-zA-Z0-9]/g, ''), // Remove special chars from category
        srNo || '0',
        ddcNo.replace(/\./g, '') || '0'
      ]
      const isbn = isbnParts.join('-').substring(0, 50) // Limit length
      
      // Build description with price note if present
      let description = (row.description || row.Description || '').toString().trim()
      if (!description) {
        description = `${title} - ${edition} Edition`
      }
      if (priceNote) {
        description += ` [Acquisition: ${priceNote}]`
      }
      
      const book = {
        title: title,
        author: author,
        isbn: isbn,
        category: category,
        edition: edition,
        publicationYear: parseInt(row.publicationYear || row['Publication Year'] || row.year) || new Date().getFullYear(),
        totalCopies: 1, // Will be incremented for duplicates
        description: description,
        department: (row.department || row.Department || '').toString().trim() || 'General',
        publisher: (row.publisher || row.Publisher || byPurchase || '').toString().trim() || 'Unknown',
        language: (row.language || row.Language || '').toString().trim() || 'English',
        price: price,
        priceNote: priceNote, // Store the text from price column (donated, gift, etc.)
        accessionNumber: srNo.length > 0 ? srNo : undefined, // Use Sr.No if provided, otherwise let backend generate
        ddcNumber: ddcNo || undefined // Store DDC No if provided
      }
      
      // Create unique key for duplicate detection: title + author (case-insensitive)
      const uniqueKey = `${title.toLowerCase()}|||${author.toLowerCase()}`
      
      if (bookMap.has(uniqueKey)) {
        // Duplicate found - increment copy count
        const existingBook = bookMap.get(uniqueKey)
        existingBook.totalCopies += 1
        
        // Update price if current row has a price and existing one doesn't
        if (price > 0 && existingBook.price === 0) {
          existingBook.price = price
        }
        
        console.log(`Duplicate found: "${title}" by ${author} - now ${existingBook.totalCopies} copies`)
      } else {
        // New unique book
        bookMap.set(uniqueKey, book)
        
        // Debug for first few unique books
        if (bookMap.size <= 3) {
          console.log(`Book #${bookMap.size}:`, JSON.stringify(book, null, 2))
        }
      }
    })

    // Convert map to array
    const uniqueBooks = Array.from(bookMap.values())
    
    // Calculate statistics
    const duplicatesFound = totalRows - uniqueBooks.length - skippedRows
    const totalCopies = uniqueBooks.reduce((sum, book) => sum + book.totalCopies, 0)
    
    // Check for books without category
    const booksWithoutCategory = uniqueBooks.filter(b => !b.category || b.category.trim() === '')
    const booksByCategory = {}
    uniqueBooks.forEach(book => {
      const cat = book.category || 'NO CATEGORY'
      if (!booksByCategory[cat]) {
        booksByCategory[cat] = 0
      }
      booksByCategory[cat]++
    })
    
    console.log('=== IMPORT SUMMARY ===')
    console.log('Total rows processed:', totalRows)
    console.log('Skipped empty rows:', skippedRows)
    console.log('Unique books:', uniqueBooks.length)
    console.log('Duplicates consolidated:', duplicatesFound)
    console.log('Total physical copies:', totalCopies)
    console.log('Invalid books:', invalid.length)
    console.log('\n=== CATEGORIES BREAKDOWN ===')
    Object.entries(booksByCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} books`)
    })
    if (booksWithoutCategory.length > 0) {
      console.log(`\n⚠️  WARNING: ${booksWithoutCategory.length} books have NO CATEGORY!`)
    }
    console.log('======================')
    
    // Show detailed alert
    if (duplicatesFound > 0) {
      const booksWithMultipleCopies = uniqueBooks.filter(b => b.totalCopies > 1).length
      setAlertDialog({
        open: true,
        title: '📚 Import Analysis',
        message: `✓ Total rows read: ${totalRows}\n` +
                 `✓ Unique books found: ${uniqueBooks.length}\n` +
                 `✓ Duplicates merged: ${duplicatesFound}\n` +
                 `✓ Books with multiple copies: ${booksWithMultipleCopies}\n` +
                 `✓ Total physical copies: ${totalCopies}\n` +
                 `✓ Skipped empty rows: ${skippedRows}\n\n` +
                 `Check the preview to see copy counts!`,
        type: 'info'
      })
    }

    setValidBooks(uniqueBooks)
    setInvalidBooks(invalid)
  }

  const handleDeleteAll = () => {
    setDeleteAllDialog(true)
  }

  const handleConfirmDeleteAll = async () => {
    try {
      await bulkDeleteMutation.mutateAsync({ bookIds: [], deleteAll: true })
      setAlertDialog({
        open: true,
        title: 'Success',
        message: 'All books have been successfully deleted.',
        type: 'success'
      })
      setStep('upload')
      setDeleteAllDialog(false)
    } catch (error) {
      console.error('Error deleting books:', error)
      setAlertDialog({
        open: true,
        title: 'Delete Failed',
        message: error.response?.data?.message || 'Failed to delete books. Please try again.',
        type: 'danger'
      })
      setDeleteAllDialog(false)
    }
  }

  const downloadFailedBooks = (failedBooks) => {
    if (!failedBooks || failedBooks.length === 0) return

    const wb = XLSX.utils.book_new()
    
    // Format failed books data with error details
    const failedData = failedBooks.map(book => ({
      'Title': book.title || 'N/A',
      'Author': book.author || 'N/A',
      'Edition': book.edition || 'N/A',
      'Category': book.category || 'N/A',
      'ISBN': book.isbn || 'N/A',
      'Accession Number': book.accessionNumber || 'N/A',
      'Error': book.error || 'Unknown error'
    }))
    
    const ws = XLSX.utils.json_to_sheet(failedData)
    
    // Set column widths
    ws['!cols'] = [
      { wch: 40 }, // Title
      { wch: 25 }, // Author
      { wch: 10 }, // Edition
      { wch: 15 }, // Category
      { wch: 20 }, // ISBN
      { wch: 15 }, // Accession Number
      { wch: 50 }  // Error
    ]
    
    XLSX.utils.book_append_sheet(wb, ws, 'Failed Books')
    XLSX.writeFile(wb, `Failed-Books-${new Date().getTime()}.xlsx`)
  }

  const handleImportBooks = async () => {
    if (validBooks.length === 0) {
      setAlertDialog({
        open: true,
        title: 'No Books to Import',
        message: 'No valid books to import. Please upload an Excel file with valid book data.',
        type: 'warning'
      })
      return
    }

    // Debug: Log first few books to see what we're sending
    console.log('=== SENDING TO BACKEND ===')
    console.log('Sending', validBooks.length, 'books')
    console.log('First 3 books being sent:', validBooks.slice(0, 3).map(b => ({
      title: b.title,
      accessionNumber: b.accessionNumber,
      price: b.price,
      priceNote: b.priceNote,
      edition: b.edition,
      author: b.author,
      description: b.description
    })))

    try {
      const result = await bulkImportMutation.mutateAsync(validBooks)
      const summary = result.data.summary
      const failedBooks = result.data.details?.failed || []
      
      let message = `✅ Import Complete!\n\n`
      message += `📚 New books added: ${summary.inserted}\n`
      message += `🔄 Existing books updated: ${summary.updated}\n`
      message += `📖 Total copies imported: ${summary.totalCopies}\n`
      
      if (summary.failed > 0) {
        message += `\n❌ Failed: ${summary.failed}\n\n`
        message += `Would you like to download the list of failed books?`
        
        setDownloadFailedDialog({
          open: true,
          failedBooks: failedBooks,
          message: message
        })
      } else {
        setAlertDialog({
          open: true,
          title: 'Import Successful',
          message: message,
          type: 'success'
        })
        handleClose()
      }
    } catch (error) {
      console.error('Error importing books:', error)
      setAlertDialog({
        open: true,
        title: 'Import Failed',
        message: error.response?.data?.message || 'Failed to import books. Please try again.',
        type: 'danger'
      })
    }
  }

  const handleClose = () => {
    setStep('select')
    setExcelData([])
    setValidBooks([])
    setInvalidBooks([])
    setIsProcessing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    
    // Create multiple category sheets as examples (matching your file structure)
    const categories = [
      { name: 'Business', title: 'Business Books Collection' },
      { name: 'Education', title: 'Education Books Collection' },
      { name: 'Technology', title: 'Technology Books Collection' },
      { name: 'Science', title: 'Science Books Collection' },
      { name: 'Mathematics', title: 'Mathematics Books Collection' }
    ]
    
    categories.forEach((category, catIndex) => {
      // Create sample data
      const sampleBooks = [
        {
          'Sr.No': catIndex * 100 + 1,
          'Title': 'Introduction to Programming',
          'Edition': '5th',
          'Price': 1295.50,
          'Author': 'John Smith',
          'By Purchase': 'do',
          'DDC No': '005.1'
        },
        {
          'Sr.No': catIndex * 100 + 2,
          'Title': 'Database Management Systems',
          'Edition': '3rd',
          'Price': 'donated',
          'Author': 'Jane Doe',
          'By Purchase': 'do',
          'DDC No': '005.74'
        },
        {
          'Sr.No': catIndex * 100 + 3,
          'Title': 'Advanced Mathematics',
          'Edition': '2nd',
          'Price': 890.75,
          'Author': 'Robert Johnson',
          'By Purchase': 'do',
          'DDC No': '510'
        },
        {
          'Sr.No': catIndex * 100 + 4,
          'Title': 'Physics for Engineers',
          'Edition': '10th',
          'Price': 'gift',
          'Author': 'David Brown',
          'By Purchase': 'do',
          'DDC No': '530'
        },
        {
          'Sr.No': catIndex * 100 + 5,
          'Title': 'Business Management',
          'Edition': '4th',
          'Price': 1099.99,
          'Author': 'Sarah Williams',
          'By Purchase': 'do',
          'DDC No': '658'
        }
      ]
      
      // Create worksheet with empty array
      const ws = XLSX.utils.aoa_to_sheet([])
      
      // Add Row 1: Title
      XLSX.utils.sheet_add_aoa(ws, [['Stock List Of Library Books']], { origin: 'A1' })
      
      // Add Row 2: Subtitle with category name
      XLSX.utils.sheet_add_aoa(ws, [[`Wisdom Hall Thal University - ${category.title}`]], { origin: 'A2' })
      
      // Add Row 3: Headers (this is where data reading starts - index 2)
      XLSX.utils.sheet_add_aoa(ws, [['Sr.No', 'Title', 'Edition', 'Price', 'Author', 'By Purchase', 'DDC No']], { origin: 'A3' })
      
      // Add Row 4+: Data
      XLSX.utils.sheet_add_json(ws, sampleBooks, { origin: 'A4', skipHeader: true })
      
      // Set column widths for better readability
      ws['!cols'] = [
        { wch: 8 },  // Sr.No
        { wch: 50 }, // Title
        { wch: 10 }, // Edition
        { wch: 12 }, // Price
        { wch: 25 }, // Author
        { wch: 15 }, // By Purchase
        { wch: 10 }  // DDC No
      ]
      
      // Merge cells for title rows
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Merge row 1 across all columns
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }  // Merge row 2 across all columns
      ]
      
      XLSX.utils.book_append_sheet(wb, ws, category.name)
    })
    
    // Add instructions sheet
    const instructions = [
      ['INSTRUCTIONS - How to use this template'],
      [''],
      ['⭐ CRITICAL: SHEET/TAB NAMES = BOOK CATEGORIES ⭐'],
      ['Each Excel sheet/tab name becomes the category for books in that sheet.'],
      ['Example: Books in "Physics" tab will have category = Physics'],
      ['         Books in "Chemistry" tab will have category = Chemistry'],
      [''],
      ['IMPORTANT: Your Excel file structure:'],
      ['- Row 1: Title (e.g., "Stock List Of Library Books")'],
      ['- Row 2: Subtitle (e.g., "Your Institution Name")'],
      ['- Row 3: Column Headers (Sr.No, Title, Edition, Price, Author, By Purchase, DDC No)'],
      ['- Row 4+: Your book data'],
      [''],
      ['REQUIRED FIELDS:'],
      ['- Title: Book title (REQUIRED - cannot be empty)'],
      [''],
      ['OPTIONAL FIELDS (will use defaults if empty):'],
      ['- Sr.No: Serial number (used as Accession Number)'],
      ['- Edition: Book edition (default: "-" if empty)'],
      ['- Price: Can be numeric (e.g., 1500.50) OR text (e.g., "donated", "gift")'],
      ['  * Numeric values are stored as book price'],
      ['  * Text values (like "donated", "gift") are displayed in the price column'],
      ['- Author: Author name (default: "Unknown")'],
      ['- By Purchase: Purchase info (stored as Publisher)'],
      ['- DDC No: Dewey Decimal Classification (used for ISBN)'],
      [''],
      ['ACCESSION NUMBER:'],
      ['- Sr.No from Excel will be used as the Accession Number'],
      ['- If Sr.No is empty, an auto-generated number will be used'],
      [''],
      ['CATEGORY HANDLING:'],
      ['- Each sheet/tab name becomes the book category (THIS IS IMPORTANT!)'],
      ['- You can add/remove/rename sheets as needed'],
      ['- Make sure sheet names match: Biology, Physics, Chemistry, etc.'],
      ['- Books without a valid sheet name will be categorized as "Miscellaneous"'],
      [''],
      ['DUPLICATE HANDLING:'],
      ['- Books with same Title + Author are considered duplicates'],
      ['- Duplicates are merged and counted as multiple copies'],
      ['- Example: 3 entries of "Advanced Math" by "John" = 1 book with 3 copies'],
      [''],
      ['FAILED BOOKS:'],
      ['- If any books fail to import, you can download a detailed error report'],
      ['- The report will include book details and specific error messages'],
      [''],
      ['ISBN GENERATION:'],
      ['- Auto-generated as: SheetName-SrNo-DDCNo'],
      ['- Example: Biology-577-123'],
      [''],
      ['TIPS:'],
      ['- Empty rows are automatically skipped'],
      ['- You can import thousands of books at once'],
      ['- The system reads from Row 3 (headers) onwards'],
      ['- Make sure Row 3 has the column headers as shown in examples'],
      ['- REMEMBER: Sheet/Tab names become categories!']
    ]
    
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions)
    wsInstructions['!cols'] = [{ wch: 80 }]
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'READ ME FIRST', 0)
    
    XLSX.writeFile(wb, 'Library-Books-Import-Template.xlsx')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6" style={{color: '#011039'}}>Bulk Book Management</h2>

        {step === 'select' && (
          <div className="space-y-6">
            <div className="text-center">
              <BookOpen className="mx-auto h-16 w-16 mb-4" style={{color: '#E76800'}} />
              <h3 className="text-lg font-medium mb-2" style={{color: '#011039'}}>
                Manage Your Book Collection
              </h3>
              <p className="text-gray-600 mb-6">
                Replace your existing book data with real library collection from Excel
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-[#E76800]">
                <Upload className="mx-auto h-12 w-12 text-[#E76800] mb-3" />
                <h4 className="font-medium mb-2" style={{color: '#011039'}}>Download Template</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Get the Excel template with required columns
                </p>
                <Button 
                  onClick={downloadTemplate}
                  className="w-full bg-[#E76800] hover:bg-[#E76800]/90"
                >
                  Download
                </Button>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-red-500">
                <Trash2 className="mx-auto h-12 w-12 text-red-500 mb-3" />
                <h4 className="font-medium mb-2" style={{color: '#011039'}}>Delete All Books</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Remove all existing books from the system
                </p>
                <Button 
                  onClick={handleDeleteAll}
                  disabled={bulkDeleteMutation.isPending}
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete All'}
                </Button>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-[#E76800]">
                <Upload className="mx-auto h-12 w-12 mb-3" style={{color: '#E76800'}} />
                <h4 className="font-medium mb-2" style={{color: '#011039'}}>Import Books</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Upload Excel file with your book collection
                </p>
                <Button 
                  onClick={() => setStep('upload')}
                  className="w-full bg-[#E76800] hover:bg-[#E76800]/90"
                >
                  Import Books
                </Button>
              </Card>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="text-center">
            <Upload className="mx-auto h-16 w-16 mb-4" style={{color: '#E76800'}} />
            <h3 className="text-lg font-medium mb-2" style={{color: '#011039'}}>
              Upload Excel File
            </h3>
            <p className="text-gray-600 mb-6">
              Select an Excel file (.xlsx, .xls) containing your book data
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Click here to upload Excel file or drag and drop
                </p>
              </label>
            </div>

            {isProcessing && <Loading />}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setStep('select')}
                variant="outline"
              >
                Back
              </Button>
              <Button
                onClick={downloadTemplate}
                className="bg-[#E76800] hover:bg-[#E76800]/90"
              >
                Download Template
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div>
            <h3 className="text-lg font-medium mb-4" style={{color: '#011039'}}>
              Preview Import Data
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="p-4 bg-green-50 border-green-200">
                <h4 className="font-medium text-green-800 mb-2">
                  ✓ Valid Books: {validBooks.length}
                </h4>
                <p className="text-sm text-green-600">
                  These books will be imported successfully
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Total copies: {validBooks.reduce((sum, book) => sum + book.totalCopies, 0)}
                </p>
              </Card>

              <Card className="p-4 bg-red-50 border-red-200">
                <h4 className="font-medium text-red-800 mb-2">
                  ✗ Invalid Books: {invalidBooks.length}
                </h4>
                <p className="text-sm text-red-600">
                  These books have errors and won't be imported
                </p>
              </Card>
            </div>

            {validBooks.filter(book => book.totalCopies > 1).length > 0 && (
              <Card className="p-4 mb-6 bg-orange-50 border-[#E76800]">
                <h4 className="font-medium mb-3" style={{color: '#011039'}}>
                  📚 Books with Multiple Copies ({validBooks.filter(book => book.totalCopies > 1).length} books)
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {validBooks
                    .filter(book => book.totalCopies > 1)
                    .slice(0, 10)
                    .map((book, index) => (
                      <div key={index} className="p-2 bg-white rounded border flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{book.title}</p>
                          <p className="text-xs text-gray-600">
                            by {book.author} - {book.edition && book.edition !== '-' ? book.edition : 'N/A'}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-medium" style={{backgroundColor: '#E76800', color: 'white'}}>
                          {book.totalCopies} copies
                        </span>
                      </div>
                    ))}
                  {validBooks.filter(book => book.totalCopies > 1).length > 10 && (
                    <p className="text-sm text-gray-600 text-center">
                      ... and {validBooks.filter(book => book.totalCopies > 1).length - 10} more
                    </p>
                  )}
                </div>
              </Card>
            )}

            {invalidBooks.length > 0 && (
              <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-3 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Errors Found
                </h4>
                <div className="max-h-40 overflow-y-auto">
                  {invalidBooks.slice(0, 5).map((item, index) => (
                    <div key={index} className="mb-2 p-2 bg-white rounded border">
                      <p className="text-sm font-medium">Row {item.row}: {item.book.title || 'Untitled'}</p>
                      <p className="text-xs text-red-600">{item.errors.join(', ')}</p>
                    </div>
                  ))}
                  {invalidBooks.length > 5 && (
                    <p className="text-sm text-gray-600">
                      ... and {invalidBooks.length - 5} more errors
                    </p>
                  )}
                </div>
              </Card>
            )}

            <div className="flex gap-3 justify-between">
              <Button
                onClick={() => setStep('upload')}
                variant="outline"
              >
                Upload Different File
              </Button>
              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImportBooks}
                  disabled={validBooks.length === 0 || bulkImportMutation.isPending}
                  className="bg-[#E76800] hover:bg-[#E76800]/90"
                >
                  {bulkImportMutation.isPending ? 'Importing...' : `Import ${validBooks.length} Books`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.open}
        onClose={() => setAlertDialog({ open: false, title: '', message: '', type: 'info' })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />

      {/* Delete All Books Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteAllDialog}
        onClose={() => setDeleteAllDialog(false)}
        onConfirm={handleConfirmDeleteAll}
        title="Delete All Books"
        message="Are you sure you want to delete ALL books from the library? This action cannot be undone and will permanently remove all book records."
        confirmText="Yes, Delete All Books"
        cancelText="Cancel"
        type="danger"
      />

      {/* Download Failed Books Confirmation Dialog */}
      <ConfirmDialog
        isOpen={downloadFailedDialog.open}
        onClose={() => {
          setDownloadFailedDialog({ open: false, failedBooks: [], message: '' })
          handleClose()
        }}
        onConfirm={() => {
          downloadFailedBooks(downloadFailedDialog.failedBooks)
          setDownloadFailedDialog({ open: false, failedBooks: [], message: '' })
          handleClose()
        }}
        title="Import Complete with Errors"
        message={downloadFailedDialog.message}
        confirmText="Yes, Download Failed Books"
        cancelText="No, Close"
        type="warning"
      />
    </Modal>
  )
}

export default BulkBookManager