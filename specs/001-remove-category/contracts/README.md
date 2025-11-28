# API Contracts: Remove Category Entity

**Feature**: 001-remove-category | **Date**: 2025-11-28

## Overview

This feature is a **schema-only change** that removes the Category entity from the database. There are no new API endpoints or contract modifications required.

## Contract Impact

### Existing Contracts
- No existing API contracts reference the Category entity (pre-MVP)
- No endpoints need to be modified

### Future Considerations
When API endpoints are implemented, the List-related endpoints will not include category fields:

```yaml
# Future: List response will not include category
List:
  type: object
  properties:
    id:
      type: string
      format: uuid
    userId:
      type: string
      format: uuid
    title:
      type: string
    slug:
      type: string
    description:
      type: string
      nullable: true
    isPublished:
      type: boolean
    publishedAt:
      type: string
      format: date-time
      nullable: true
    createdAt:
      type: string
      format: date-time
    updatedAt:
      type: string
      format: date-time
  required:
    - id
    - userId
    - title
    - slug
    - isPublished
    - createdAt
    - updatedAt
```

## URL Structure Change

The URL structure for lists changes from:
- **Before**: `/@{vanity_slug}/{category-slug}/{list-slug}`
- **After**: `/@{vanity_slug}/{list-slug}`

This is documented in the feature specification and does not require API contract changes at this stage.
