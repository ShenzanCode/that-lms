import api from '../lib/axios'

export const bookService = {
  getBooks: async (params) => {
    const response = await api.get('/books', { params })
    return response.data
  },

  getPublicBooks: async (params) => {
    const response = await api.get('/books/public', { params })
    return response.data
  },

  getBook: async (id) => {
    const response = await api.get(`/books/${id}`)
    return response.data
  },

  createBook: async (bookData) => {
    const response = await api.post('/books', bookData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  updateBook: async (id, bookData) => {
    const response = await api.put(`/books/${id}`, bookData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  deleteBook: async (id) => {
    const response = await api.delete(`/books/${id}`)
    return response.data
  },

  searchBooks: async (query) => {
    const response = await api.get('/books/search', { params: { q: query } })
    return response.data
  },

  bulkImport: async (books) => {
    const response = await api.post('/books/bulk-import', { books })
    return response.data
  },

  bulkDelete: async (bookIds, deleteAll = false) => {
    const response = await api.delete('/books/bulk-delete', { 
      data: { bookIds, deleteAll } 
    })
    return response.data
  },

  getCategories: async () => {
    const response = await api.get('/books/categories')
    return response.data
  },
}
