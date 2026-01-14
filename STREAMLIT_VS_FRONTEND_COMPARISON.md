# Streamlit vs Frontend Comparison - Issues Found

## Critical Differences

### 1. **Business Type Field**
**Streamlit:** Free text input (e.g., "specialty coffee shop")
**Frontend:** Dropdown with limited options: "saas", "ecommerce", "service", "marketplace", "other"
**Backend:** Accepts any string
**Issue:** Frontend restricts input to predefined values, but backend accepts any string like Streamlit

### 2. **Business Stage Values**
**Streamlit:** Uses "idea", "startup", "growth", "mature"
**Frontend:** Uses "idea", "startup", "growth", "established", "enterprise"
**Backend:** Accepts any string
**Issue:** Frontend has "established" and "enterprise" but Streamlit uses "mature". Backend accepts both, but this inconsistency could cause confusion.

### 3. **Required Fields**
**Streamlit:** Only requires:
- business_type
- business_stage  
- main_goal
- other_goals (can be empty)

**Frontend:** Requires:
- businessName (not required by backend!)
- industry (not required by backend!)
- location
- teamSize
- mainGoal

**Issue:** Frontend validation is stricter than backend, preventing submission when backend would accept it.

### 4. **Other Goals Format**
**Streamlit:** Comma-separated string that gets split: `"goal1, goal2".split(",")`
**Frontend:** Array of strings: `["goal1", "goal2"]`
**Backend:** Expects `List[str]` - Frontend is correct!

### 5. **Prompt Text**
**Streamlit:** `f"Help me with: {main_goal}"`
**Backend:** `f"Help me achieve: {data.main_goal}"`
**Issue:** Different prompts might produce different results

### 6. **Number Parsing**
**Frontend:** Uses `Number.parseInt()` which can return `NaN` or `0` for empty strings
**Streamlit:** Uses direct number input with defaults
**Issue:** Frontend might send `0` when user leaves field empty, but backend expects `None` for optional fields

## Root Causes

1. **Frontend validation too strict** - Requires fields backend doesn't need
2. **Business type mismatch** - Frontend dropdown vs Streamlit free text
3. **Number handling** - Frontend sends `0` instead of `null` for empty fields
4. **Business stage values** - Different options between Streamlit and frontend
