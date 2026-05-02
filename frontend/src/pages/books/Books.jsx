import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, RefreshCw, Database } from 'lucide-react'
import { bookService } from '@/services/bookService'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchBar } from '@/components/ui/SearchBar'
import { Pagination } from '@/components/ui/Pagination'
import { LoadingSpinner } from '@/components/ui/Loading'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { BookCover } from '@/components/ui/BookCover'
import BulkBookManager from '@/components/BulkBookManager'

export default function Books() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    status: '',
  })
  const [isBulkManagerOpen, setIsBulkManagerOpen] = useState(false)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['books', page, search, filters],
    queryFn: () => bookService.getBooks({ page, limit: 10, search, sortBy: 'title', ...filters }),
  })

  // Reset page to 1 when search or filters change
  const handleSearchChange = (newSearch) => {
    setSearch(newSearch)
    setPage(1) // Reset to first page when searching
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
    setPage(1) // Reset to first page when filtering
  }

  const handleRefresh = () => {
    refetch()
  }

  // Sort books to show ones with covers first
  const sortedBooks = data?.data ? [...data.data].sort((a, b) => {
    // Books with covers come first
    if (a.coverImage && !b.coverImage) return -1
    if (!a.coverImage && b.coverImage) return 1
    // If both have covers or both don't have covers, maintain original order
    return 0
  }) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Books</h1>
          <p className="mt-1" style={{color: '#011039'}}>Manage your library collection</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setIsBulkManagerOpen(true)}
            style={{backgroundColor: '#E76800', borderColor: '#E76800', color: 'white'}}
            className="hover:bg-[#E76800]/90"
          >
            <Database className="h-4 w-4" />
            Bulk Management
          </Button>
          <Link to="/admin/books/add">
            <Button variant="primary">
              <Plus className="h-4 w-4" />
              Add Book
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="p-4 space-y-4">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Search books by title, author, ISBN..."
          />
          <div className="flex flex-wrap gap-4">
            <select
              className="input w-full sm:w-48"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Biology">Biology</option>
              <option value="Business">Business</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Communication and Media">Communication and Media</option>
              <option value="Computer / Computer Science">Computer / Computer Science</option>
              <option value="Education">Education</option>
              <option value="English">English</option>
              <option value="History">History</option>
              <option value="Information Technology">Information Technology</option>
              <option value="International Relations">International Relations</option>
              <option value="Islamic Studies">Islamic Studies</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Miscellaneous">Miscellaneous</option>
              <option value="Physics">Physics</option>
              <option value="Psychology">Psychology</option>
              <option value="Social Work">Social Work</option>
              <option value="Sociology">Sociology</option>
              <option value="Sports Sciences">Sports Sciences</option>
              <option value="Urdu">Urdu</option>
              <option value="Zoology">Zoology</option>
            </select>
            <select
              className="input w-full sm:w-48"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Not Available">Not Available</option>
              <option value="Damaged">Damaged</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Books Table */}
      <Card>
        {isLoading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : data?.data?.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{backgroundColor: '#011039'}}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Cover</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Sr.No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Edition</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Available</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedBooks.map((book) => (
                    <tr key={book._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <BookCover 
                          src={book.coverImage} 
                          alt={`Cover of ${book.title}`}
                          size="sm"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium" style={{color: '#011039'}}>{book.accessionNumber}</td>
                      <td className="px-6 py-4">
                        <Link to={`/admin/books/${book._id}`} className="text-sm font-medium hover:underline" style={{color: '#E76800'}}>
                          {book.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{color: '#011039'}}>{book.author}</td>
                      <td className="px-6 py-4 text-sm" style={{color: '#011039'}}>
                        {book.edition && book.edition !== '-' ? book.edition : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{color: '#011039'}}>
                        {(() => {
                          // Check if there's an acquisition note in description
                          const acquisitionMatch = book.description?.match(/\[Acquisition: ([^\]]+)\]/)
                          if (acquisitionMatch) {
                            return <span className="text-green-600 font-medium capitalize">{acquisitionMatch[1]}</span>
                          }
                          return book.price && book.price > 0 ? `Rs. ${book.price.toFixed(2)}` : '-'
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{color: '#011039'}}>{book.category}</td>
                      <td className="px-6 py-4 text-sm" style={{color: '#011039'}}>{book.availableCopies}/{book.totalCopies}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={book.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/admin/books/${book._id}/edit`}>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.pagination && (
              <div className="p-4 border-t">
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.pages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={Search}
            title="No books found"
            description="Try adjusting your search or filters"
            action={
              <Link to="/admin/books/add">
                <Button variant="primary">
                  <Plus className="h-4 w-4" />
                  Add Your First Book
                </Button>
              </Link>
            }
          />
        )}
      </Card>

      {/* Bulk Book Manager Modal */}
      <BulkBookManager 
        isOpen={isBulkManagerOpen}
        onClose={() => setIsBulkManagerOpen(false)}
      />
    </div>
  )
}
