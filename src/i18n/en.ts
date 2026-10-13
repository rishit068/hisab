/**
 * All user-facing strings for Hisaab.
 * NEVER use these banned words: balance, net, ledger, settlement, sync, authenticate
 * Use instead: owe, get back, paid, saved, signed in
 */

export const en = {
  // App
  appName: 'Hisaab',

  // Greeting
  greeting: 'Hello, {{name}}',

  // Home
  homeNoExpenses: 'No expenses yet. Tap the button below to add one.',
  homeOverallOwed: 'Overall you owe ₹{{amount}}',
  homeOverallGetBack: 'Overall you get back ₹{{amount}}',
  homeAllSettled: 'You are all settled up',
  homeYouOwe: 'You owe {{name}} ₹{{amount}}',
  homeOwesYou: '{{name}} owes you ₹{{amount}}',
  homeSettledWith: 'You and {{name}} are settled up',
  homeUpdatedJustNow: 'Updated just now',
  homeAddExpense: 'Add expense',

  // Invite / Auth
  inviteWelcome: 'Welcome. Are you {{name}}?',
  inviteYes: "Yes, that's me",
  inviteNo: 'No',
  inviteNoHelp: 'Please ask the person who sent you this link for help.',
  inviteExpired: 'This link has expired. Please ask for a new one.',
  inviteUsed: 'This link has already been used.',
  inviteMaxDevices: 'This person already has 2 devices linked. Please ask the admin to remove a device first.',
  inviteAlreadyLinked: 'This device is already linked to a member.',
  inviteInvalid: 'This invite link is not valid.',
  inviteLoading: 'Checking your invite...',
  inviteError: 'Something went wrong. Please try again or ask for a new link.',

  // Welcome (unauthenticated)
  welcomeTitle: 'Hisaab',
  welcomeSubtitle: 'Shared expenses, made simple.',
  welcomeNeedInvite: 'You need an invite link to get started. Ask your family member to send you one.',

  // iPhone banner
  iphoneBanner: 'Tap Share, then Add to Home Screen, so Hisaab always stays signed in.',
  iphoneBannerDismiss: 'Got it',

  // Logout
  logoutConfirm: 'Log out of Hisaab on this device? You will need a new invite link to come back.',
  logoutStay: 'Stay signed in',
  logoutButton: 'Log out',
  logoutTitle: 'Log out',

  // Add expense
  addExpenseTitle: 'Add expense',
  addExpenseHowMuch: 'How much?',
  addExpenseWhatFor: 'What was it for?',
  addExpenseCategory: 'Category',
  addExpenseWhoPaid: 'Who paid?',
  addExpenseSplitBetween: 'Split between',
  addExpenseCustomAmounts: 'Custom amounts',
  addExpenseDate: 'Date',
  addExpenseSave: 'Save',
  addExpenseStillToAssign: '₹{{amount}} still to assign',
  addExpenseOverAssigned: '₹{{amount}} over-assigned',
  addExpenseAllAssigned: 'All assigned',
  addExpenseReviewTitle: 'Review',
  addExpenseReviewEqual: '{{name}} paid ₹{{amount}} for {{category}}. Split equally among {{count}} people (₹{{share}} each). Save this?',
  addExpenseReviewCustom: '{{name}} paid ₹{{amount}} for {{category}}. Custom split. Save this?',
  addExpenseConfirm: 'Yes, save',
  addExpenseGoBack: 'Go back',
  addExpenseSaved: 'Saved.',
  addExpenseUndo: 'Undo',

  // History
  historyTitle: 'History',
  historyEmpty: 'No expenses yet.',
  historyPaidBy: 'Paid by {{name}}',
  historyAddedBy: 'added by {{name}}',
  historyFilterAll: 'All',
  historyFilterMine: 'Mine',
  historyFilterThisMonth: 'This month',
  historyShowDeleted: 'Show deleted',
  historyHideDeleted: 'Hide deleted',

  // Detail view
  detailEdit: 'Edit',
  detailDelete: 'Delete',
  detailDeleteConfirm: 'Delete this expense? You can restore it later.',
  detailDeleteYes: 'Yes, delete',
  detailDeleteNo: 'Keep it',
  detailRestore: 'Restore',
  detailRestoreConfirm: 'Restore this expense?',
  detailRestoreYes: 'Yes, restore',
  detailChangeLog: '{{name}} {{action}} · {{date}}',

  // Settle up
  settleTitle: 'Settle up',
  settleWithPerson: 'Settle up with {{name}}',
  settleAmount: 'Amount',
  settleReview: 'You are recording that you paid ₹{{amount}} to {{name}}. This does not send any money.',
  settleConfirm: 'Yes, record payment',
  settleGoBack: 'Go back',
  settleSaved: 'Payment recorded.',

  // Menu
  menuTitle: 'Menu',
  menuMembers: 'Members',
  menuCategories: 'Categories',
  menuTextSize: 'Text size',
  menuExport: 'Export all data',
  menuLogout: 'Log out',
  menuTextSizeNormal: 'Normal',
  menuTextSizeLarge: 'Large',
  menuTextSizeExtraLarge: 'Extra large',
  menuComingSoon: 'Coming soon',

  // Members admin
  membersTitle: 'Members',
  membersCreateInvite: 'Create invite link',
  membersRemoveDevice: 'Remove this device',
  membersRemoveConfirm: 'Remove this device? The person will need a new invite link to sign back in.',
  membersRemoveYes: 'Yes, remove',
  membersRemoveNo: 'Keep it',
  membersRename: 'Rename',

  // Navigation
  navHome: 'Home',
  navHistory: 'History',
  navMenu: 'Menu',

  // Offline
  offlineBanner: 'No internet. Entries will be saved on your phone and sent automatically when back online.',
  offlineWaitingToSend: 'Waiting to send',
  offlinePendingNotice: '{{count}} entry waiting to send when back online',
  offlinePendingNoticePlural: '{{count}} entries waiting to send when back online',
  offlineSentSuccess: 'Saved to group.',

  // Errors
  errorGeneric: 'Something went wrong. Please try again.',
  errorNoConnection: 'Could not connect. Please check your internet.',
} as const;

export type TranslationKey = keyof typeof en;
