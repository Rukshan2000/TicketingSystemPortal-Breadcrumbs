'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersList } from '@/components/users/users-list';
import { RolesList } from '@/components/users/roles-list';
import { Users, Shield } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          User Management
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1 sm:mt-2">
          Manage users, roles, and permissions
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800 w-full sm:w-auto grid grid-cols-2 sm:flex">
          <TabsTrigger value="users" className="gap-2 text-sm sm:text-base">
            <Users className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Users</span>
            <span className="xs:hidden sm:hidden">Users</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2 text-sm sm:text-base">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Roles & Permissions</span>
            <span className="sm:hidden">Roles</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersList />
        </TabsContent>

        <TabsContent value="roles">
          <RolesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
