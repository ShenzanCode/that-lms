import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'

export default function StaffManagement() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', role: 'Librarian' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role
      }
      const res = await authService.register(payload)
      toast.success(res.message || 'Staff created successfully')
      setForm({ name: '', username: '', email: '', password: '', role: 'Librarian' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create staff')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Staff Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1 block">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input" />
            </div>
            <div>
              <label className="label mb-1 block">Username</label>
              <input name="username" value={form.username} onChange={handleChange} required className="input" />
            </div>
            <div>
              <label className="label mb-1 block">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="input" />
            </div>
            <div>
              <label className="label mb-1 block">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required className="input" />
            </div>
            <div>
              <label className="label mb-1 block">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className="input">
                <option value="Librarian">Librarian</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end mt-2">
              <Button type="submit" variant="primary" loading={loading}>Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
