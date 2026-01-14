# Unnecessary Features in Frontend

## Summary
This document lists all unnecessary, mock, or non-functional features in the frontend that can be removed or need backend implementation.

---

## 🔴 High Priority - Remove or Implement

### 1. **Google OAuth Button** (Login Page)
**Location:** `frontend/components/auth/login-form.tsx:89-109`
- **Status:** Non-functional - No handler, no OAuth flow
- **Action:** Remove button OR implement OAuth backend
- **Impact:** Confusing UX - button does nothing

### 2. **Sign Up Button** (Login Page)
**Location:** `frontend/components/auth/login-form.tsx:111`
- **Status:** Non-functional - No handler, no registration page
- **Action:** Remove OR create registration flow
- **Impact:** Dead link - user clicks and nothing happens

### 3. **Payment History Section** (Billing Page)
**Location:** `frontend/app/dashboard/billing/page.tsx:313-355`
- **Status:** Mock data only - Hardcoded array `mockPaymentHistory`
- **Action:** Remove OR implement `GET /api/billing/payments` endpoint
- **Impact:** Shows fake data, misleading to users

### 4. **Payment Method Section** (Billing Page)
**Location:** `frontend/app/dashboard/billing/page.tsx:357-379`
- **Status:** Mock display - Hardcoded card "•••• 4242", no real data
- **Action:** Remove OR implement Stripe integration
- **Impact:** Shows fake payment method

### 5. **Invoice Download Button** (Billing Page)
**Location:** `frontend/app/dashboard/billing/page.tsx:343`
- **Status:** Demo only - Shows toast "Invoice download started (Demo)"
- **Action:** Remove OR implement `GET /api/billing/invoices/{id}` endpoint
- **Impact:** Button does nothing useful

### 6. **Update Payment Method Button** (Billing Page)
**Location:** `frontend/app/dashboard/billing/page.tsx:374`
- **Status:** Demo only - Shows toast "Stripe checkout (Demo)"
- **Action:** Remove OR implement Stripe checkout flow
- **Impact:** Button does nothing

### 7. **2FA Enable Button** (Settings Page)
**Location:** `frontend/app/dashboard/settings/page.tsx:341`
- **Status:** Demo only - Shows toast "2FA setup (Demo)"
- **Action:** Remove OR implement 2FA backend endpoints
- **Impact:** Button does nothing

### 8. **Delete Account Button** (Settings Page)
**Location:** `frontend/app/dashboard/settings/page.tsx:359`
- **Status:** Demo only - Shows error toast, no actual deletion
- **Action:** Remove OR implement `DELETE /api/user` endpoint
- **Impact:** Dangerous - users expect it to work but it doesn't

### 9. **Profile Picture Upload** (Settings Page)
**Location:** `frontend/app/dashboard/settings/page.tsx:98-116`
- **Status:** Demo only - Shows toast "Image upload (Demo)"
- **Action:** Remove upload button OR implement file upload endpoint
- **Impact:** Button does nothing

---

## 🟡 Medium Priority - Consider Removing

### 10. **Mock Visualization Data**
**Location:** `frontend/lib/mock-data.ts:3-40`
- **Status:** Hardcoded visualization data, not used anymore
- **Action:** Remove file or unused exports
- **Impact:** Dead code - consultations now get data from backend

### 11. **Mock Strategy Text**
**Location:** `frontend/lib/mock-data.ts:42-112`
- **Status:** Long hardcoded strategy text, not used
- **Action:** Remove if not referenced
- **Impact:** Dead code

### 12. **Mock Consultations Array**
**Location:** `frontend/lib/mock-data.ts:114-230`
- **Status:** Not used - consultations come from API now
- **Action:** Remove if not referenced
- **Impact:** Dead code

### 13. **Mock User Data**
**Location:** `frontend/lib/mock-data.ts:232-242`
- **Status:** Still used as fallback in user store
- **Action:** Keep as fallback OR remove if always using API
- **Impact:** Fallback mechanism

### 14. **Subscription Plans Constant**
**Location:** `frontend/lib/mock-data.ts:244-289`
- **Status:** Static data, could come from backend
- **Action:** Keep for now (used in UI) OR move to backend config
- **Impact:** Static pricing - consider making dynamic

---

## 🟢 Low Priority - Nice to Have but Not Critical

### 15. **Top Nav Search (Global)**
**Location:** `frontend/components/dashboard/top-nav.tsx:44-50`
- **Status:** Now functional but limited to consultations
- **Action:** Keep - it works
- **Note:** Could expand to search all content

### 16. **Notifications Bell Icon**
**Location:** `frontend/components/dashboard/top-nav.tsx:62-67`
- **Status:** UI only - no notification system
- **Action:** Remove badge OR implement notifications
- **Impact:** Shows red dot but no notifications

---

## 📊 Summary by Category

### **Completely Non-Functional (Remove)**
1. Google OAuth button
2. Sign up button
3. Invoice download button
4. Update payment method button
5. 2FA enable button
6. Delete account button
7. Profile picture upload button

### **Mock Data (Remove or Implement Backend)**
8. Payment history section
9. Payment method display
10. Mock visualization data (if unused)
11. Mock strategy text (if unused)
12. Mock consultations array (if unused)

### **Partially Functional (Keep but Improve)**
13. Mock user data (fallback)
14. Subscription plans (static but used)

---

## 🎯 Recommended Actions

### **Immediate Removals:**
```typescript
// Remove these buttons/features that do nothing:
- Google OAuth button (login-form.tsx)
- Sign up button (login-form.tsx)
- Invoice download button (billing/page.tsx)
- Update payment method button (billing/page.tsx)
- 2FA enable button (settings/page.tsx)
- Delete account button (settings/page.tsx)
- Profile picture upload button (settings/page.tsx)
```

### **Clean Up Dead Code:**
```typescript
// Remove from mock-data.ts if not used:
- mockVisualizationData (if backend provides this)
- mockStrategy (if not referenced)
- mockConsultations (if not referenced)
```

### **Consider for Future:**
- Move subscription plans to backend config
- Implement real payment history endpoint
- Implement Stripe integration for payment methods
- Add real notification system

---

## 💡 Impact Assessment

**User Confusion:** High
- Users see buttons that don't work
- Mock data looks real but isn't
- Dead features create false expectations

**Code Maintenance:** Medium
- Dead code increases complexity
- Mock data needs to be kept in sync (or removed)
- Unused imports and files

**Development Time:** Low
- Most are simple removals
- Some require backend work if keeping features

---

## ✅ Features to Keep (Functional)

These features are working and should NOT be removed:
- ✅ Consultation CRUD operations
- ✅ Feedback submission
- ✅ PDF export
- ✅ Share functionality
- ✅ Search consultations
- ✅ User profile update
- ✅ Notification preferences
- ✅ Password change
- ✅ Plan upgrade
- ✅ Delete consultation
