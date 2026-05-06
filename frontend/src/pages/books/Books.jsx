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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-secondary">Books Inventory</h1>
          <p className="mt-1 text-slate-500 font-bold">Manage and monitor your library collection</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="secondary" 
            onClick={handleRefresh}
            disabled={isFetching}
            className="rounded-md font-black uppercase tracking-widest text-[11px]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setIsBulkManagerOpen(true)}
            className="rounded-md bg-primary hover:bg-primary/90 border-none text-white font-black uppercase tracking-widest text-[11px] shadow-md shadow-orange-500/20"
          >
            <Database className="h-4 w-4 mr-2" />
            Bulk Management
          </Button>
          <Link to="/admin/books/add">
            <Button variant="primary" className="rounded-md font-black uppercase tracking-widest text-[11px] shadow-md shadow-orange-500/20">
              <Plus className="h-4 w-4 mr-2" />
              Add Book
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="rounded-lg border-slate-100 shadow-sm">
        <div className="p-6 space-y-6">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Search books by title, author, ISBN..."
            className="rounded-md border-2 border-slate-100 focus:border-primary transition-all"
          />
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-64">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Category Filter</p>
              <select
                className="input w-full rounded-md border-2 border-slate-100 focus:border-primary font-bold"
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
            <div className="w-full sm:w-64">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-1 tracking-widest">Status Filter</p>
              <select
                className="input w-full rounded-md border-2 border-slate-100 focus:border-primary font-bold"
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
          <div className="p-20 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : data?.data?.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-widest">Cover</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-widest">Sr.No</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-widest">Title</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-widest">Author</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-widest">Edition</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-widest">Price</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-widest">Available</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-white uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-white uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedBooks.map((book) => (
                    <tr key={book._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="shadow-sm rounded-md overflow-hidden w-fit">
                          <BookCover 
                            src={book.coverImage} 
                            alt={`Cover of ${book.title}`}
                            size="sm"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-secondary">{book.accessionNumber}</td>
                      <td className="px-6 py-4">
                        <Link to={`/admin/books/${book._id}`} className="text-sm font-black text-primary hover:underline underline-offset-4 decoration-2">
                          {book.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-600">{book.author}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-500">
                        {book.edition && book.edition !== '-' ? book.edition : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-secondary">
                        {(() => {
                          // Check if there's an acquisition note in description
                          const acquisitionMatch = book.description?.match(/\[Acquisition: ([^\]]+)\]/)
                          if (acquisitionMatch) {
                            return <span className="text-success-600 font-black uppercase text-[10px] tracking-wider bg-success/10 px-2 py-1 rounded-md">{acquisitionMatch[1]}</span>
                          }
                          return book.price && book.price > 0 ? `Rs. ${book.price.toFixed(0)}` : '-'
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-500">{book.category}</td>
                      <td className="px-6 py-4 text-sm font-black text-secondary">{book.availableCopies}/{book.totalCopies}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={book.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/admin/books/${book._id}/edit`}>
                          <Button variant="ghost" size="sm" className="rounded-md font-black uppercase text-[10px] tracking-widest">Edit</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.pagination && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50">
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
                <Button variant="primary" className="rounded-md px-8 h-12 font-black uppercase tracking-widest text-xs">
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
