'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Building2, Users, Mail, Settings, UserSearch, Database } from 'lucide-react'

const navigation = [
  {
    name: 'Company Data',
    href: '/companies',
    icon: Building2,
    description: 'Upload and manage company data'
  },
  {
    name: 'Contact Mining',
    href: '/contact-mining',
    icon: UserSearch,
    description: 'Mine contacts from company data'
  },
  {
    name: 'Contacts',
    href: '/contacts',
    icon: Users,
    description: 'Manage contacts and groups'
  },
  {
    name: 'Email Campaigns',
    href: '/campaigns',
    icon: Mail,
    description: 'Manage email outreach campaigns'
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Email Agent</h1>
            <p className="text-xs text-gray-500">Contact Mining Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={cn(
                'w-4 h-4',
                isActive ? 'text-blue-600' : 'text-gray-400'
              )} />
              <div className="flex-1 min-w-0">
                <div className={cn(
                  'font-medium',
                  isActive ? 'text-blue-700' : 'text-gray-900'
                )}>
                  {item.name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>Contact Mining Platform</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </div>
    </div>
  )
}