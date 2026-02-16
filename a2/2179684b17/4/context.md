# Session Context

## User Prompts

### Prompt 1

<teammate-message teammate_id="team-lead">
You are implementing enhancements to `/components/board/CapacityBoard.vue` for a capacity planning application.

Read the current file first, then implement these changes:

1. **Pass allInitiatives to BoardRow:**
   - The BoardRow component now needs an `allInitiatives` prop for warning calculations
   - Pass `allInitiatives` from `initiativesStore.initiatives` to each BoardRow

2. **Update drop-member handler:**
   - The `handleDropMember` function now...

### Prompt 2

<teammate-message teammate_id="team-lead">
{"type":"task_assignment","taskId":"4","subject":"Update CapacityBoard.vue to pass allInitiatives and handle startWeek","description":"Modify `/components/board/CapacityBoard.vue` to:\n1. Add `allInitiatives` prop to BoardRow component\n2. Update `handleDropMember` to include `startWeek` parameter\n3. Update the emit signature to include `startWeek` in `add-assignment` payload\n\nKey changes:\n- Pass `allInitiatives` from initiativesStore to each BoardR...

