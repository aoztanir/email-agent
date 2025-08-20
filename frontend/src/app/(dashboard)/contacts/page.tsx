'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Users, Plus, Search, Filter, UserPlus, Tags, Building2, Globe, Mail, CheckCircle, AlertTriangle, Zap, Trash2, AlertCircle } from 'lucide-react'
import { supabase, type Contact, type ContactGroup, type Company, type ContactGroupMember, type ContactEmail } from '@/lib/supabase'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [groupMembers, setGroupMembers] = useState<ContactGroupMember[]>([])
  const [contactEmails, setContactEmails] = useState<ContactEmail[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterByGroup, setFilterByGroup] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [deleteMode, setDeleteMode] = useState<'contacts' | 'companies' | 'all' | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // New group form
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [newGroupColor, setNewGroupColor] = useState('#3b82f6')
  const [showNewGroupForm, setShowNewGroupForm] = useState(false)

  useEffect(() => {
    fetchContacts()
    fetchGroups()
    fetchCompanies()
    fetchGroupMembers()
    fetchContactEmails()
  }, [])

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contact')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_group')
        .select('*')
        .order('name')

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('company')
        .select('*')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchGroupMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_group_member')
        .select('*')

      if (error) throw error
      setGroupMembers(data || [])
    } catch (error) {
      console.error('Error fetching group members:', error)
    }
  }

  const fetchContactEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_email')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setContactEmails(data || [])
    } catch (error) {
      console.error('Error fetching contact emails:', error)
    }
  }

  const createGroup = async () => {
    if (!newGroupName.trim()) return

    try {
      const { data, error } = await supabase
        .from('contact_group')
        .insert({
          name: newGroupName,
          description: newGroupDescription || null,
          color: newGroupColor
        })
        .select()

      if (error) throw error

      await fetchGroups()
      setNewGroupName('')
      setNewGroupDescription('')
      setNewGroupColor('#3b82f6')
      setShowNewGroupForm(false)
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group')
    }
  }

  const addContactsToGroup = async () => {
    if (!selectedGroup || selectedContacts.length === 0) {
      alert('Please select a group and at least one contact')
      return
    }

    setLoading(true)
    try {
      // Remove existing memberships for these contacts in this group
      await supabase
        .from('contact_group_member')
        .delete()
        .eq('group_id', selectedGroup)
        .in('contact_id', selectedContacts)

      // Add new memberships
      const memberships = selectedContacts.map(contactId => ({
        group_id: selectedGroup,
        contact_id: contactId
      }))

      const { error } = await supabase
        .from('contact_group_member')
        .insert(memberships)

      if (error) throw error

      await fetchGroupMembers()
      setSelectedContacts([])
      alert('Contacts added to group successfully!')
    } catch (error) {
      console.error('Error adding contacts to group:', error)
      alert('Failed to add contacts to group')
    } finally {
      setLoading(false)
    }
  }

  const removeContactFromGroup = async (contactId: string, groupId: string) => {
    try {
      const { error } = await supabase
        .from('contact_group_member')
        .delete()
        .eq('contact_id', contactId)
        .eq('group_id', groupId)

      if (error) throw error
      await fetchGroupMembers()
    } catch (error) {
      console.error('Error removing contact from group:', error)
      alert('Failed to remove contact from group')
    }
  }

  const deleteSelectedContacts = async () => {
    if (selectedContacts.length === 0) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('contact')
        .delete()
        .in('id', selectedContacts)

      if (error) throw error

      await fetchContacts()
      await fetchContactEmails()
      await fetchGroupMembers()
      setSelectedContacts([])
      alert(`Successfully deleted ${selectedContacts.length} contact(s)`)
    } catch (error) {
      console.error('Error deleting contacts:', error)
      alert('Failed to delete contacts')
    } finally {
      setLoading(false)
    }
  }

  const deleteAllContacts = async () => {
    setLoading(true)
    try {
      // Get all contact IDs first
      const { data: contactsData, error: fetchError } = await supabase
        .from('contact')
        .select('id')

      if (fetchError) throw fetchError

      if (contactsData && contactsData.length > 0) {
        const contactIds = contactsData.map(c => c.id)
        
        // Delete in chunks to avoid query size limits
        const chunkSize = 100
        for (let i = 0; i < contactIds.length; i += chunkSize) {
          const chunk = contactIds.slice(i, i + chunkSize)
          const { error } = await supabase
            .from('contact')
            .delete()
            .in('id', chunk)

          if (error) throw error
        }
      }

      await fetchContacts()
      await fetchContactEmails()
      await fetchGroupMembers()
      setSelectedContacts([])
      alert('Successfully deleted all contacts')
    } catch (error) {
      console.error('Error deleting all contacts:', error)
      alert(`Failed to delete all contacts: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
      setDeleteMode(null)
      setShowDeleteConfirm(false)
    }
  }

  const deleteAllCompanies = async () => {
    setLoading(true)
    try {
      // Get all company IDs first
      const { data: companiesData, error: fetchError } = await supabase
        .from('company')
        .select('id')

      if (fetchError) throw fetchError

      if (companiesData && companiesData.length > 0) {
        const companyIds = companiesData.map(c => c.id)
        
        // Delete in chunks to avoid query size limits
        const chunkSize = 100
        for (let i = 0; i < companyIds.length; i += chunkSize) {
          const chunk = companyIds.slice(i, i + chunkSize)
          const { error } = await supabase
            .from('company')
            .delete()
            .in('id', chunk)

          if (error) throw error
        }
      }

      await fetchContacts()
      await fetchCompanies()
      await fetchContactEmails()
      await fetchGroupMembers()
      setSelectedContacts([])
      alert('Successfully deleted all companies and their contacts')
    } catch (error) {
      console.error('Error deleting all companies:', error)
      alert(`Failed to delete all companies: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
      setDeleteMode(null)
      setShowDeleteConfirm(false)
    }
  }

  const deleteAllData = async () => {
    setLoading(true)
    try {
      // Delete scraping jobs first (using Supabase)
      const { data: jobsData, error: jobsFetchError } = await supabase
        .from('scraping_job')
        .select('id')

      if (!jobsFetchError && jobsData && jobsData.length > 0) {
        const jobIds = jobsData.map(j => j.id)
        const chunkSize = 100
        for (let i = 0; i < jobIds.length; i += chunkSize) {
          const chunk = jobIds.slice(i, i + chunkSize)
          const { error } = await supabase
            .from('scraping_job')
            .delete()
            .in('id', chunk)
          if (error) console.warn('Error deleting some jobs:', error)
        }
      }

      // Delete all companies (this will cascade to contacts due to foreign key)
      const { data: companiesData, error: fetchError } = await supabase
        .from('company')
        .select('id')

      if (fetchError) throw fetchError

      if (companiesData && companiesData.length > 0) {
        const companyIds = companiesData.map(c => c.id)
        
        // Delete in chunks to avoid query size limits
        const chunkSize = 100
        for (let i = 0; i < companyIds.length; i += chunkSize) {
          const chunk = companyIds.slice(i, i + chunkSize)
          const { error } = await supabase
            .from('company')
            .delete()
            .in('id', chunk)

          if (error) throw error
        }
      }

      await fetchContacts()
      await fetchCompanies()
      await fetchContactEmails()
      await fetchGroupMembers()
      setSelectedContacts([])
      alert('Successfully deleted all data (companies, contacts, emails, and mining jobs)')
    } catch (error) {
      console.error('Error deleting all data:', error)
      alert(`Failed to delete all data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
      setDeleteMode(null)
      setShowDeleteConfirm(false)
    }
  }

  const handleDeleteAction = () => {
    if (deleteMode === 'contacts') {
      deleteAllContacts()
    } else if (deleteMode === 'companies') {
      deleteAllCompanies()
    } else if (deleteMode === 'all') {
      deleteAllData()
    }
  }

  const deleteIndividualContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('contact')
        .delete()
        .eq('id', contactId)

      if (error) throw error

      await fetchContacts()
      await fetchContactEmails()
      await fetchGroupMembers()
      setSelectedContacts(selectedContacts.filter(id => id !== contactId))
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Failed to delete contact')
    }
  }

  // Get company name for a contact
  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    return company?.name || 'Unknown Company'
  }

  // Get group name and color for a contact
  const getContactGroups = (contactId: string) => {
    const memberGroups = groupMembers
      .filter(gm => gm.contact_id === contactId)
      .map(gm => groups.find(g => g.id === gm.group_id))
      .filter(Boolean)
    return memberGroups
  }

  // Get emails for a contact
  const getContactEmails = (contactId: string) => {
    return contactEmails.filter(email => email.contact_id === contactId)
  }

  // Filter contacts based on search and group filter
  const filteredContacts = contacts.filter(contact => {
    const contactEmails = getContactEmails(contact.id)
    const matchesSearch = !searchQuery || 
      `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCompanyName(contact.company_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      contactEmails.some(email => email.email.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesGroupFilter = !filterByGroup || filterByGroup === 'all-groups' || 
      getContactGroups(contact.id).some(group => group?.id === filterByGroup)

    return matchesSearch && matchesGroupFilter
  })

  const colorOptions = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact Management</h1>
        <p className="text-gray-600 mt-2">Organize and manage your contact database with groups</p>
      </div>

      {/* Groups Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tags className="w-5 h-5" />
            <span>Contact Groups</span>
          </CardTitle>
          <CardDescription>Create and manage contact groups for better organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <Badge 
                key={group.id} 
                variant="secondary" 
                style={{ backgroundColor: group.color + '20', color: group.color, borderColor: group.color }}
                className="px-3 py-1"
              >
                {group.name} ({groupMembers.filter(gm => gm.group_id === group.id).length})
              </Badge>
            ))}
          </div>

          {showNewGroupForm ? (
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    placeholder="e.g., High Priority, Tech Companies"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="group-color">Color</Label>
                  <div className="flex gap-1 mt-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewGroupColor(color)}
                        className={`w-6 h-6 rounded-full border-2 ${
                          newGroupColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="group-description">Description (Optional)</Label>
                <Input
                  id="group-description"
                  placeholder="Brief description of this group"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createGroup} disabled={!newGroupName.trim()}>
                  Create Group
                </Button>
                <Button variant="outline" onClick={() => setShowNewGroupForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowNewGroupForm(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5" />
            <span>Bulk Actions</span>
          </CardTitle>
          <CardDescription>Add selected contacts to groups or manage data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Group Assignment */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label htmlFor="bulk-group">Select Group</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: group.color }}
                        />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={addContactsToGroup} 
              disabled={!selectedGroup || selectedContacts.length === 0 || loading}
            >
              Add {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''} to Group
            </Button>
          </div>

          <Separator />

          {/* Delete Actions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Delete Operations</h4>
                <p className="text-sm text-gray-600">Manage your data with bulk delete options</p>
              </div>
            </div>

            {/* Selected Contacts Delete */}
            {selectedContacts.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">
                  Delete {selectedContacts.length} selected contact{selectedContacts.length !== 1 ? 's' : ''}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={deleteSelectedContacts}
                  disabled={loading}
                  className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
            )}

            {/* Bulk Delete Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">All Contacts</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setDeleteMode('contacts')
                    setShowDeleteConfirm(true)
                  }}
                  disabled={loading || contacts.length === 0}
                  className="text-red-600 hover:text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">All Companies</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setDeleteMode('companies')
                    setShowDeleteConfirm(true)
                  }}
                  disabled={loading || companies.length === 0}
                  className="text-red-600 hover:text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">All Data</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setDeleteMode('all')
                    setShowDeleteConfirm(true)
                  }}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {selectedContacts.length > 0 && (
            <p className="text-sm text-gray-600">
              {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              {deleteMode === 'contacts' && `Are you sure you want to delete all ${contacts.length} contacts? This action cannot be undone.`}
              {deleteMode === 'companies' && `Are you sure you want to delete all ${companies.length} companies and their associated contacts? This action cannot be undone.`}
              {deleteMode === 'all' && 'Are you sure you want to delete ALL data (companies, contacts, emails, and mining jobs)? This action cannot be undone and will completely reset your database.'}
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteMode(null)
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeleteAction}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contacts List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Contacts ({filteredContacts.length})</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span>All contacts from your mining operations</span>
              {(() => {
                const totalEmails = contactEmails.length
                const verifiedEmails = contactEmails.filter(e => e.is_deliverable === true).length
                const contactsWithEmails = [...new Set(contactEmails.map(e => e.contact_id))].length
                
                return totalEmails > 0 && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-emerald-700">{totalEmails} emails found</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-700">{verifiedEmails} verified</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-700">{contactsWithEmails} contacts with emails</span>
                    </div>
                  </div>
                )
              })()}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              fetchContacts()
              fetchContactEmails()
              fetchGroupMembers()
            }}>
              <Mail className="w-4 h-4 mr-2" />
              Refresh All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search contacts, companies, or email addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterByGroup} onValueChange={setFilterByGroup}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-groups">All Groups</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No contacts found</p>
              <p className="text-sm">Start by running a contact mining job</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredContacts.map((contact) => {
                const contactGroups = getContactGroups(contact.id)
                const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim()
                
                return (
                  <div key={contact.id} className="flex items-start justify-between p-5 border rounded-xl hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50/30 transition-all duration-200 shadow-sm hover:shadow-md">
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedContacts([...selectedContacts, contact.id])
                          } else {
                            setSelectedContacts(selectedContacts.filter(id => id !== contact.id))
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className="font-medium text-gray-900 text-lg">{fullName}</h4>
                        </div>
                        
                        {/* Email Section with beautiful styling */}
                        {(() => {
                          const foundEmails = getContactEmails(contact.id)
                          const hasOriginalEmail = contact.email
                          const hasFoundEmails = foundEmails.length > 0
                          
                          if (!hasOriginalEmail && !hasFoundEmails) return null
                          
                          return (
                            <div className="space-y-2 mb-3">
                              {/* Original contact email */}
                              {hasOriginalEmail && (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">{contact.email}</span>
                                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-100 ml-2">
                                      Original
                                    </Badge>
                                  </div>
                                </div>
                              )}
                              
                              {/* MailScout found emails */}
                              {hasFoundEmails && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                                      MailScout Found ({foundEmails.length})
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {foundEmails.map((email) => (
                                      <div 
                                        key={email.id} 
                                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                      >
                                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-900">
                                          {email.email}
                                        </span>
                                        
                                        {/* Deliverability status */}
                                        {email.is_deliverable === true && (
                                          <div className="flex items-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                            <span className="text-xs text-green-700 font-medium">Verified</span>
                                          </div>
                                        )}
                                        {email.is_deliverable === false && (
                                          <div className="flex items-center gap-1">
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                            <span className="text-xs text-amber-700">Unverified</span>
                                          </div>
                                        )}
                                        {email.is_deliverable === null && (
                                          <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                                            Pending
                                          </Badge>
                                        )}
                                        
                                        {/* Found by indicator */}
                                        <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-50">
                                          {email.found_by}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                        
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                          <Building2 className="w-3 h-3" />
                          {getCompanyName(contact.company_id)}
                        </div>

                        {contact.bio && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {contact.bio.length > 150 ? contact.bio.substring(0, 150) + '...' : contact.bio}
                          </p>
                        )}

                        {contact.linkedin_url && (
                          <div className="flex items-center gap-1 mt-2">
                            <Globe className="w-3 h-3 text-gray-400" />
                            <a
                              href={contact.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              LinkedIn
                            </a>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 mt-2">
                          {contactGroups.map((group) => (
                            <Badge
                              key={group?.id}
                              variant="secondary"
                              style={{ 
                                backgroundColor: group?.color + '20', 
                                color: group?.color, 
                                borderColor: group?.color 
                              }}
                              className="text-xs cursor-pointer hover:opacity-80"
                              onClick={() => removeContactFromGroup(contact.id, group?.id!)}
                              title={`Click to remove from ${group?.name}`}
                            >
                              {group?.name} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteIndividualContact(contact.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 p-1 h-6 w-6"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}