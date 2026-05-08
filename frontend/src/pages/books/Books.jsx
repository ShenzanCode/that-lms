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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-100">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-secondary">Books Inventory</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-bold">Manage and monitor your library collection</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
          <Button 
            variant="secondary" 
            onClick={handleRefresh}
            disabled={isFetching}
            className="rounded-md font-black uppercase tracking-widest text-[10px] sm:text-[11px] h-9 sm:h-10 px-2 sm:px-3"
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setIsBulkManagerOpen(true)}
            className="rounded-md bg-primary hover:bg-primary/90 border-none text-white font-black uppercase tracking-widest text-[10px] sm:text-[11px] shadow-md shadow-orange-500/20 h-9 sm:h-10 px-2 sm:px-3"
          >
            <Database className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Bulk</span>
          </Button>
          <Link to="/admin/books/add">
            <Button variant="primary" className="rounded-md font-black uppercase tracking-widest text-[10px] sm:text-[11px] shadow-md shadow-orange-500/20 h-9 sm:h-10 px-2 sm:px-3">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="rounded-lg border-slate-100 shadow-sm">
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Search books by title, author, ISBN..."
            className="rounded-md border-2 border-slate-100 focus:border-primary transition-all text-sm"
          />
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="w-full sm:w-auto sm:flex-1">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Category Filter</p>
              <select
                className="input w-full rounded-md border-2 border-slate-100 focus:border-primary font-bold text-sm"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Biology">Biology</option>
                <option value="Business">Business</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Communication and Media">Communication and Media</option>
                <option value="CS & IT">CS & IT</option>
                <option value="Education">Education</option>
                <option value="English">English</option>
                <option value="History">History</option>
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
            </div>
            <div className="w-full sm:w-auto sm:flex-1">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Status Filter</p>
              <select
                className="input w-full rounded-md border-2 border-slate-100 focus:border-primary font-bold text-sm"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Available">Available</option>
                <option value="Issued">Issued</option>
                <option value="Damaged">Damaged</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Books Table */}
      <Card className="rounded-lg border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 sm:p-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : data?.data?.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-secondary">
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Cover</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Sr.No</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Title</th>
                    <th className="hidden sm:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Author</th>
                    <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Edition</th>
                    <th className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Price</th>
                    <th className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Category</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Available</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Status</th>
                    <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedBooks.map((book) => (
                    <tr key={book._id} className="hover:bg-slate-50 transition-colors text-xs sm:text-sm">
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <div className="shadow-sm rounded-md overflow-hidden w-fit">
                          <BookCover 
                            src={book.coverImage} 
                            alt={`Cover of ${book.title}`}
                            size="sm"
                          />
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-black text-secondary whitespace-nowrap">{book.accessionNumber}</td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <Link to={`/admin/books/${book._id}`} className="font-black text-primary hover:underline underline-offset-4 decoration-2">
                          {book.title}
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold text-slate-600">{book.author}</td>
                      <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold text-slate-500">
                        {book.edition && book.edition !== '-' ? book.edition : '-'}
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-black text-secondary">
                        {(() => {
                          // Check if there's an acquisition note in description
                          const acquisitionMatch = book.description?.match(/\[Acquisition: ([^\]]+)\]/)
                          if (acquisitionMatch) {
                            return <span className="text-success-600 font-black uppercase text-[9px] tracking-wider bg-success/10 px-2 py-1 rounded-md">{acquisitionMatch[1]}</span>
                          }
                          return book.price && book.price > 0 ? `Rs. ${book.price.toFixed(0)}` : '-'
                        })()}
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold text-slate-500">{book.category}</td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-black text-secondary whitespace-nowrap">{book.availableCopies}/{book.totalCopies}</td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <StatusBadge status={book.status} />
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right">
                        <Link to={`/admin/books/${book._id}/edit`}>
                          <Button variant="ghost" size="sm" className="rounded-md font-black uppercase text-[9px] sm:text-[10px] tracking-widest px-2 h-8">Edit</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.pagination && (
              <div className="p-3 sm:p-4 md:p-6 border-t border-slate-100 bg-slate-50/50">
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
                <Button variant="primary" className="rounded-md px-6 sm:px-8 h-10 sm:h-12 font-black uppercase tracking-widest text-xs">
                  <Plus className="h-4 w-4 mr-2" />
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
