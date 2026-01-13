# Changelog

All notable changes to MealPrepBuddy will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Recipe editing functionality - users can now edit existing recipes without creating new versions
  - Added edit button to recipe cards in Recipe Manager
  - Added edit modal with form to update recipe title, servings, notes, and tags
  - Frontend: Added `RecipeUpdate` type in `types.ts`
  - Frontend: Added `updateRecipe()` API method in `services/api.ts`
  - Frontend: Added `handleEditRecipe()` handler in `App.tsx`
  - Frontend: Implemented edit UI in `RecipeManager.tsx` with modal form
  - Backend: Already supported via existing PATCH `/recipes/{recipe_id}` endpoint

### Changed
- Improved recipe name display throughout the application
  - **Sidebar (Pantry)**: Recipe names now display up to 2 lines (was truncated to 1 line)
  - **Schedule Grid**: Recipe names now display up to 3 lines (was limited to 2 lines)
  - Added tooltip on hover to show full recipe name
  - Improved responsive design for schedule grid on larger screens (max-width: 1600px)
  - Better line height and spacing for improved readability

### Fixed
- Fixed recipe name truncation issues in schedule view
- Recipe names no longer cut off prematurely in weekly planner
- Improved text wrapping for long recipe titles on both desktop and mobile

## Notes
- No recipe versioning: editing a recipe updates it in place
- Backend API for recipe updates was already implemented; changes are frontend-only
