import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, BookOpen, User, Calendar, AlertCircle } from 'lucide-react'
import { transactionService } from '@/services/transactionService'
import { bookService } from '@/services/bookService'
import { memberService } from '@/services/memberService'
import { MemberPhoto } from '@/components/ui/MemberPhoto'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function IssueBook() {
  const navigate = useNavigate()
  const [bookSearch, setBookSearch] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedBook, setSelectedBook] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showBookResults, setShowBookResults] = useState(false)
  const [showMemberResults, setShowMemberResults] = useState(false)

  // Search books
  const { data: booksData, isLoading: loadingBooks } = useQuery({
    queryKey: ['books-search', bookSearch],
    queryFn: () => bookService.getBooks({ search: bookSearch, limit: 5, status: 'Available' }),
    enabled: bookSearch.length > 2,
  })

  // Search members
  const { data: membersData, isLoading: loadingMembers } = useQuery({
    queryKey: ['members-search', memberSearch],
    queryFn: () => memberService.getMembers({ search: memberSearch, limit: 5, isBlocked: 'false' }),
    enabled: memberSearch.length > 2,
  })

  // Issue book mutation
  const issueBookMutation = useMutation({
    mutationFn: transactionService.issueBook,
    onSuccess: (data) => {
      toast.success('Book issued successfully!')
      navigate('/admin/transactions/issued')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to issue book')
    },
  })

  const handleSelectBook = (book) => {
    setSelectedBook(book)
    setBookSearch('')
    setShowBookResults(false)
  }

  const handleSelectMember = (member) => {
    setSelectedMember(member)
    setMemberSearch('')
    setShowMemberResults(false)
  }

  const handleIssue = () => {
    if (!selectedBook || !selectedMember) {
      toast.error('Please select both a book and a member')
      return
    }

    issueBookMutation.mutate({
      bookId: selectedBook._id,
      memberId: selectedMember._id,
      accessionNumber: selectedBook.accessionNumber,
    })
  }

  const canBorrow = selectedMember && !selectedMember.isBlocked && 
    new Date(selectedMember.validUntil) > new Date() &&
    selectedMember.currentBorrowedBooks < selectedMember.borrowingLimit

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/transactions/issued')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#011039'}}>Issue Book</h1>
          <p className="mt-1" style={{color: '#011039'}}>Issue a book to a library member</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Select Book */}
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5" style={{color: '#E76800'}} />
              <h3 className="text-lg font-bold" style={{color: '#011039'}}>Select Book</h3>
            </div>

            {!selectedBook ? (
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="Search Book"
                    placeholder="Search by title, author, ISBN, or accession number..."
                    value={bookSearch}
                    onChange={(e) => {
                      setBookSearch(e.target.value)
                      setShowBookResults(true)
                    }}
                    onFocus={() => setShowBookResults(true)}
                  />
                  <Search className="absolute right-3 top-9 h-4 w-4 text-gray-400" />
                </div>

                {showBookResults && bookSearch.length > 2 && (
                  <div className="border rounded-lg max-h-80 overflow-y-auto">
                    {loadingBooks ? (
                      <div className="p-4 text-center text-gray-500">Searching...</div>
                    ) : booksData?.data?.length > 0 ? (
                      <div className="divide-y">
                        {booksData.data.map((book) => (
                          <button
                            key={book._id}
                            onClick={() => handleSelectBook(book)}
                            className="w-full p-4 text-left hover:bg-orange-50 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold" style={{color: '#011039'}}>{book.title}</p>
                                <p className="text-sm" style={{color: '#011039'}}>{book.author}</p>
                                <p className="text-xs mt-1" style={{color: '#6B7280'}}>
                                  Acc: {book.accessionNumber} | Available: {book.availableCopies}/{book.totalCopies}
                                </p>
                              </div>
                              <Badge variant="success">{book.status}</Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center" style={{color: '#011039'}}>No books found</div>
                    )}
                  </div>
                )}

                {bookSearch.length > 0 && bookSearch.length <= 2 && (
                  <p className="text-sm text-gray-500">Type at least 3 characters to search</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{backgroundColor: '#FFF3E0'}}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold" style={{color: '#011039'}}>{selectedBook.title}</p>
                      <p className="text-sm mt-1" style={{color: '#011039'}}>{selectedBook.author}</p>
                      <p className="text-sm mt-2" style={{color: '#6B7280'}}>
                        Publisher: {selectedBook.publisher || 'N/A'}
                      </p>
                      <p className="text-sm" style={{color: '#6B7280'}}>
                        Category: {selectedBook.category}
                      </p>
                      <p className="text-sm" style={{color: '#6B7280'}}>
                        Accession No: {selectedBook.accessionNumber}
                      </p>
                      <div className="mt-3">
                        <Badge variant="success">Available: {selectedBook.availableCopies}/{selectedBook.totalCopies}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBook(null)}
                  className="w-full"
                >
                  Change Book
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Select Member */}
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5" style={{color: '#E76800'}} />
              <h3 className="text-lg font-bold" style={{color: '#011039'}}>Select Member</h3>
            </div>

            {!selectedMember ? (
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="Search Member"
                    placeholder="Search by name, ID, email, or phone..."
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value)
                      setShowMemberResults(true)
                    }}
                    onFocus={() => setShowMemberResults(true)}
                  />
                  <Search className="absolute right-3 top-9 h-4 w-4" style={{color: '#E76800'}} />
                </div>

                {showMemberResults && memberSearch.length > 2 && (
                  <div className="border rounded-lg max-h-80 overflow-y-auto">
                    {loadingMembers ? (
                      <div className="p-4 text-center" style={{color: '#6B7280'}}>Searching...</div>
                    ) : membersData?.data?.length > 0 ? (
                      <div className="divide-y">
                        {membersData.data.map((member) => {
                          const isExpired = new Date(member.validUntil) < new Date()
                          const canBorrow = !member.isBlocked && !isExpired &&
                            member.currentBorrowedBooks < member.borrowingLimit
                          
                          return (
                            <button
                              key={member._id}
                              onClick={() => handleSelectMember(member)}
                              disabled={!canBorrow}
                              className={`w-full p-4 text-left transition-colors ${
                                canBorrow ? 'hover:bg-orange-50' : 'opacity-60 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex gap-3 items-start">
                                <MemberPhoto
                                  src={member.photo}
                                  alt={member.name}
                                  size="sm"
                                />
                                <div className="flex-1">
                                  <p className="font-bold" style={{color: '#011039'}}>{member.name}</p>
                                  <p className="text-sm" style={{color: '#011039'}}>{member.memberId} • {member.memberType}</p>
                                  <p className="text-xs mt-1" style={{color: '#6B7280'}}>
                                    Borrowed: {member.currentBorrowedBooks}/{member.borrowingLimit}
                                  </p>
                                  {(member.isBlocked || isExpired) && (
                                    <p className="text-xs text-danger-600 mt-1">
                                      {member.isBlocked ? 'Blocked' : 'Expired'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center" style={{color: '#011039'}}>No members found</div>
                    )}
                  </div>
                )}

                {memberSearch.length > 0 && memberSearch.length <= 2 && (
                  <p className="text-sm" style={{color: '#6B7280'}}>Type at least 3 characters to search</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${canBorrow ? 'bg-green-50' : 'bg-red-50'}`} style={{backgroundColor: canBorrow ? '#F0FDF4' : '#FEF2F2'}}>
                  <div className="flex gap-4 items-start">
                    <MemberPhoto
                      src={selectedMember.photo}
                      alt={selectedMember.name}
                      size="lg"
                    />
                    <div className="flex-1">
                      <p className="font-bold" style={{color: '#011039'}}>{selectedMember.name}</p>
                      <p className="text-sm mt-1" style={{color: '#011039'}}>
                        {selectedMember.memberId} • {selectedMember.memberType}
                      </p>
                      <p className="text-sm mt-2" style={{color: '#6B7280'}}>
                        Department: {selectedMember.department}
                      </p>
                      <p className="text-sm" style={{color: '#6B7280'}}>
                        Email: {selectedMember.email}
                      </p>
                      <p className="text-sm" style={{color: '#6B7280'}}>
                        Phone: {selectedMember.phone}
                      </p>
                      <p className="text-sm" style={{color: '#6B7280'}}>
                        Currently Borrowed: {selectedMember.currentBorrowedBooks}/{selectedMember.borrowingLimit}
                      </p>
                      <p className="text-sm" style={{color: '#6B7280'}}>
                        Valid Until: {format(new Date(selectedMember.validUntil), 'PP')}
                      </p>
                      <div className="mt-3">
                        <Badge variant={canBorrow ? 'success' : 'danger'}>
                          {canBorrow ? 'Can Borrow' : (selectedMember.isBlocked ? 'Blocked' : 'Cannot Borrow')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {!canBorrow && (
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-danger-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-danger-700">
                      {selectedMember.isBlocked
                        ? `Member is blocked: ${selectedMember.blockReason}`
                        : new Date(selectedMember.validUntil) < new Date()
                        ? 'Membership has expired'
                        : 'Member has reached borrowing limit'}
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMember(null)}
                  className="w-full"
                >
                  Change Member
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Issue Summary & Action */}
      {selectedBook && selectedMember && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4" style={{color: '#011039'}}>Issue Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm mb-1" style={{color: '#6B7280'}}>Book</p>
                <p className="font-bold" style={{color: '#011039'}}>{selectedBook.title}</p>
                <p className="text-sm" style={{color: '#6B7280'}}>Acc: {selectedBook.accessionNumber}</p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{color: '#6B7280'}}>Member</p>
                <p className="font-bold" style={{color: '#011039'}}>{selectedMember.name}</p>
                <p className="text-sm" style={{color: '#6B7280'}}>{selectedMember.memberId}</p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{color: '#6B7280'}}>Issue Date</p>
                <p className="font-bold" style={{color: '#011039'}}>{format(new Date(), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm mb-1" style={{color: '#6B7280'}}>Due Date</p>
                <p className="font-bold" style={{color: '#011039'}}>
                  {format(
                    new Date(Date.now() + (selectedMember.memberType === 'Faculty' ? 30 : selectedMember.memberType === 'Staff' ? 21 : 14) * 24 * 60 * 60 * 1000),
                    'PPP'
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedBook(null)
                  setSelectedMember(null)
                }}
              >
                Reset
              </Button>
              <Button
                variant="primary"
                onClick={handleIssue}
                disabled={!canBorrow || issueBookMutation.isPending}
                loading={issueBookMutation.isPending}
              >
                <BookOpen className="h-4 w-4" />
                Issue Book
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
