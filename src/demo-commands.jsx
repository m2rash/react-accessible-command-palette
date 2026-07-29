import {
  CodeIcon,
  EditIcon,
  EyeIcon,
  FileIcon,
  InboxIcon,
  JumpIcon,
  SearchIcon,
  SettingsIcon,
  SignOutIcon,
  TerminalIcon,
  ThemeIcon,
} from './demo-icons'

/**
 * Sample data for the demo.
 *
 * Item model:
 *
 *   {
 *     id:       'file.new',              // required, stable – carries the option's DOM id
 *     label:    'New File',
 *     icon:     <FileIcon />,            // optional, rendered left of the label
 *     keywords: ['create', 'blank'],     // optional, feeds into fuzzy matching
 *     shortcut: ['Mod', 'N'],            // optional, see shortcuts.js
 *     hint:     'Creates an empty document', // optional
 *     disabled: false,                   // optional
 *     children: [...],                   // optional → opens a sublist
 *     perform:  (item) => {},            // optional → leaf action
 *   }
 *
 * `id` must be unique within a level and must not contain a `/` – the path key
 * built from it carries the re-announcement while filtering.
 *
 * `icon` is any React node. It is always hidden from screen readers: the label
 * already carries the meaning. If your source data only has icon *names* (JSON from
 * an API, say), map name → node here while building the items; the palette itself
 * stays agnostic.
 *
 * The list may change at any time: just pass a new array. The palette resolves every
 * level freshly on each render, even while it is open.
 *
 * @param {(message: string) => void} run  demo action
 * @param {Array<{id: string, label: string}>} feed  changing entries
 */
export function createDemoCommands(run, feed = []) {
  return [
    // Once the list is empty the entry disappears entirely. If the user happens to
    // be inside this submenu, the palette pops up one level and announces it.
    ...(feed.length > 0
      ? [
          {
            id: 'inbox',
            label: 'Inbox',
            icon: <InboxIcon />,
            keywords: ['messages', 'feed', 'dynamic'],
            children: feed.map((entry) => ({
              id: entry.id,
              label: entry.label,
              perform: () => run(`Opened: ${entry.label}`),
            })),
          },
        ]
      : []),
    {
      id: 'file',
      label: 'File',
      keywords: ['document'],
      children: [
        {
          id: 'file.new',
          label: 'New File',
          icon: <FileIcon />,
          keywords: ['create', 'blank'],
          shortcut: ['Mod', 'N'],
          hint: 'Creates an empty document',
          perform: () => run('New File'),
        },
        {
          id: 'file.open',
          label: 'Open File',
          keywords: ['load'],
          shortcut: ['Mod', 'O'],
          perform: () => run('Open File'),
        },
        {
          id: 'file.save',
          label: 'Save',
          shortcut: ['Mod', 'S'],
          perform: () => run('Save'),
        },
        {
          id: 'file.saveAs',
          label: 'Save As …',
          shortcut: ['Mod', 'Shift', 'S'],
          perform: () => run('Save As'),
        },
        {
          id: 'file.recent',
          label: 'Recent',
          keywords: ['history'],
          children: [
            {
              id: 'file.recent.notes',
              label: 'notes.md',
              perform: () => run('Opened notes.md'),
            },
            {
              id: 'file.recent.budget',
              label: 'budget-2026.csv',
              perform: () => run('Opened budget-2026.csv'),
            },
            {
              id: 'file.recent.readme',
              label: 'README.md',
              perform: () => run('Opened README.md'),
            },
          ],
        },
        {
          id: 'file.close',
          label: 'Close Window',
          shortcut: ['Mod', 'W'],
          perform: () => run('Close Window'),
        },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: <EditIcon />,
      children: [
        {
          id: 'edit.undo',
          label: 'Undo',
          shortcut: ['Mod', 'Z'],
          perform: () => run('Undo'),
        },
        {
          id: 'edit.redo',
          label: 'Redo',
          shortcut: ['Mod', 'Shift', 'Z'],
          perform: () => run('Redo'),
        },
        {
          id: 'edit.cut',
          label: 'Cut',
          shortcut: ['Mod', 'X'],
          perform: () => run('Cut'),
        },
        {
          id: 'edit.copy',
          label: 'Copy',
          shortcut: ['Mod', 'C'],
          perform: () => run('Copy'),
        },
        {
          id: 'edit.paste',
          label: 'Paste',
          shortcut: ['Mod', 'V'],
          perform: () => run('Paste'),
        },
      ],
    },
    {
      id: 'view',
      label: 'View',
      icon: <EyeIcon />,
      keywords: ['display'],
      children: [
        {
          id: 'view.sidebar',
          label: 'Toggle Sidebar',
          shortcut: ['Mod', 'B'],
          perform: () => run('Toggle Sidebar'),
        },
        {
          id: 'view.fullscreen',
          label: 'Full Screen',
          keywords: ['fullscreen'],
          perform: () => run('Full Screen'),
        },
        {
          id: 'view.zoomIn',
          label: 'Zoom In',
          shortcut: ['Mod', '+'],
          perform: () => run('Zoom In'),
        },
        {
          id: 'view.zoomOut',
          label: 'Zoom Out',
          shortcut: ['Mod', '-'],
          perform: () => run('Zoom Out'),
        },
        {
          id: 'view.zoomReset',
          label: 'Reset Zoom',
          shortcut: ['Mod', '0'],
          perform: () => run('Reset Zoom'),
        },
      ],
    },
    {
      id: 'theme',
      label: 'Switch Theme',
      icon: <ThemeIcon />,
      keywords: ['appearance', 'dark', 'light'],
      children: [
        { id: 'theme.light', label: 'Light', perform: () => run('Theme: Light') },
        { id: 'theme.dark', label: 'Dark', perform: () => run('Theme: Dark') },
        { id: 'theme.system', label: 'System Default', perform: () => run('Theme: System') },
      ],
    },
    {
      id: 'goto',
      label: 'Go to File …',
      icon: <JumpIcon />,
      keywords: ['navigate', 'jump'],
      shortcut: ['Mod', 'P'],
      perform: () => run('Go to File'),
    },
    {
      id: 'search',
      label: 'Search in Project',
      icon: <SearchIcon />,
      keywords: ['find', 'grep'],
      shortcut: ['Mod', 'Shift', 'F'],
      perform: () => run('Search in Project'),
    },
    {
      id: 'terminal',
      label: 'Toggle Terminal',
      icon: <TerminalIcon />,
      keywords: ['console', 'shell'],
      perform: () => run('Toggle Terminal'),
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: <SettingsIcon />,
      keywords: ['options', 'preferences', 'configuration'],
      shortcut: ['Mod', ','],
      perform: () => run('Open Settings'),
    },
    // Deliberately without an icon: shows that the column is still reserved and the
    // labels stay aligned.
    {
      id: 'devtools',
      label: 'Open Developer Tools',
      hint: 'Not available in this environment',
      disabled: true,
    },
    {
      id: 'debug',
      label: 'Reload Window',
      icon: <CodeIcon />,
      keywords: ['restart', 'refresh'],
      perform: () => run('Reload Window'),
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: <SignOutIcon />,
      keywords: ['logout', 'signout'],
      perform: () => run('Sign Out'),
    },
  ]
}
