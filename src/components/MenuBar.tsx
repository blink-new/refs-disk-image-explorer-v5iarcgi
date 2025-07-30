import React from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar';

export const MenuBar: React.FC = () => {
  return (
    <div className="border-b border-gray-300 bg-gray-50">
      <Menubar className="border-none bg-transparent">
        <MenubarMenu>
          <MenubarTrigger className="text-sm px-3 py-1">File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Add Evidence Item...</MenubarItem>
            <MenubarItem>Create Disk Image...</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Export Directory Listing...</MenubarItem>
            <MenubarItem>Export Files...</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Exit</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-sm px-3 py-1">Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Copy</MenubarItem>
            <MenubarItem>Select All</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Find...</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-sm px-3 py-1">View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Refresh</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Evidence Tree</MenubarItem>
            <MenubarItem>File List</MenubarItem>
            <MenubarItem>Properties</MenubarItem>
            <MenubarItem>Hex Viewer</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Status Bar</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-sm px-3 py-1">Tools</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>File System Analysis</MenubarItem>
            <MenubarItem>Hash Verification</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Generate Report...</MenubarItem>
            <MenubarItem>Export Case...</MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-sm px-3 py-1">Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>User Guide</MenubarItem>
            <MenubarItem>Keyboard Shortcuts</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>About ReFS Explorer</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
};