# KKM Smart Vote - API Documentation

**API Base URL:** `http://localhost:8000/api` (Development)
**API Version:** 1.0
**Last Updated:** April 6, 2026

---

## 📑 Table of Contents

1. [Authentication](#authentication)
2. [Voting API](#voting-api)
3. [Election API](#election-api)
4. [Candidates API](#candidates-api)
5. [Statistics API](#statistics-api)
6. [Voucher API](#voucher-api)
7. [User API](#user-api)
8. [Response Format](#response-format)
9. [Error Codes](#error-codes)
10. [Rate Limiting](#rate-limiting)

---

## Authentication

### JWT Token (For Voters)

**Obtained from:** `POST /api/voting/verify-otp`

```
Authorization: Bearer {voting_token}
```

**Token Expiry:** 1 hour (3600 seconds)

### API Token (For Admin/Panitia)

**Obtained from:** `POST /api/login` (pending implementation)

```
Authorization: Bearer {api_token}
```

---

## Voting API

### 1. Request OTP

**Endpoint:** `POST /api/voting/request-otp`
**Authentication:** None
**Rate Limit:** 3 requests per minute per email

**Request Body:**
```json
{
    "email": "test@example.com"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "OTP sent to test@example.com",
    "data": {
        "masked_email": "te***@example.com",
        "expires_in": 900
    }
}
```

**Response (400 Bad Request):**
```json
{
    "success": false,
    "message": "Invalid email format",
    "error": "email_invalid"
}
```

**Response (429 Too Many Requests):**
```json
{
    "success": false,
    "message": "Too many OTP requests. Please try again after 60 seconds",
    "error": "rate_limit_exceeded"
}
```

**Notes:**
- OTP is valid for 15 minutes (900 seconds)
- Test OTP: Use `000000` for development
- Production: OTP sent via Brevo SMTP
- Max 5 attempts per email per day

---

### 2. Verify OTP

**Endpoint:** `POST /api/voting/verify-otp`
**Authentication:** None
**Rate Limit:** 5 attempts per OTP

**Request Body:**
```json
{
    "email": "test@example.com",
    "otp_code": "000000"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "OTP verified successfully",
    "data": {
        "voting_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwMDAiLCJhdWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNjExOjEzMzQxOCwiZXhwIjoxNjExOTQyMjE4fQ.4aTQVPMXxCPqfDWlM-qDdwM4xvqMSDIYHaJb78GiJnw",
        "expires_in": 3600
    }
}
```

**Response (400 Bad Request):**
```json
{
    "success": false,
    "message": "Invalid or expired OTP",
    "error": "otp_invalid"
}
```

**Response (429 Too Many Requests):**
```json
{
    "success": false,
    "message": "Too many failed OTP attempts. Please request a new OTP",
    "error": "otp_max_attempts"
}
```

**Notes:**
- OTP must be verified within 15 minutes
- Max 5 incorrect attempts
- After expiry, user must request new OTP
- Voting token valid for 1 hour

---

### 3. Member Lookup (Layer 2 Verification)

**Endpoint:** `GET /api/voting/member-lookup/{nik}`
**Authentication:** Required (Bearer token)
**Rate Limit:** Unlimited

**Path Parameters:**
- `{nik}` - Member NIK (10 digits, string)

**Headers:**
```
Authorization: Bearer {voting_token}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Member found",
    "data": {
        "nik": "1001000001",
        "name": "Budi Santoso",
        "email": "1001000001@example.com",
        "is_eligible": true,
        "has_voted": false,
        "department": {
            "id": 1,
            "name": "MANAGEMENT",
            "site_id": 1
        },
        "site": {
            "id": 1,
            "code": "HEAD_OFFICE",
            "name": "Kantor Pusat",
            "location": "Jakarta"
        }
    }
}
```

**Response (404 Not Found):**
```json
{
    "success": false,
    "message": "Member not found",
    "error": "member_not_found"
}
```

**Response (403 Forbidden):**
```json
{
    "success": false,
    "message": "Member is not eligible to vote",
    "error": "member_not_eligible"
}
```

**Response (409 Conflict):**
```json
{
    "success": false,
    "message": "Member has already voted",
    "error": "member_already_voted"
}
```

**Notes:**
- NIK must be exactly 10 digits
- Member must have is_eligible = true
- Member must not have voted yet
- Returns member's department and site info

---

### 4. Get Candidates with Details

**Endpoint:** `GET /api/voting/candidates-with-details`
**Authentication:** Optional (for vote counts)
**Rate Limit:** Unlimited

**Query Parameters:**
- `order_by` - Sort field: `order_display` (default), `name`, `vote_count`
- `sort` - Sort direction: `asc` (default), `desc`

**Example:**
```
GET /api/voting/candidates-with-details?order_by=order_display&sort=asc
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Candidates retrieved successfully",
    "data": [
        {
            "id": 1,
            "order_display": 1,
            "name": "Drs. Agus Supriadi, MBA",
            "position": "Chairperson",
            "bio": "Experienced in management with 20 years in the industry",
            "vision": "To lead the organization towards modern and progressive management",
            "mission": "Improve operational efficiency and member welfare",
            "full_photo_url": "https://example.com/candidates/agus-supriadi.jpg",
            "department": {
                "id": 1,
                "name": "MANAGEMENT"
            },
            "vote_count": 12
        },
        {
            "id": 2,
            "order_display": 2,
            "name": "Ir. Sri Wahyuni, M.M.",
            "position": "Vice Chairperson",
            "bio": "Expert in finance and strategic planning",
            "vision": "Build a sustainable organization",
            "mission": "Strengthen financial management and transparency",
            "full_photo_url": "https://example.com/candidates/sri-wahyuni.jpg",
            "department": {
                "id": 2,
                "name": "FINANCE"
            },
            "vote_count": 8
        }
    ]
}
```

**Notes:**
- Candidates sorted by order_display by default
- Vote counts updated in real-time after each vote
- Photos stored in public/candidates/ folder
- Requires bearer token for real vote counts (anon sees 0)

---

### 5. Get Election Status

**Endpoint:** `GET /api/voting/election-status`
**Authentication:** Required (Bearer token)
**Rate Limit:** Unlimited

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Election status retrieved",
    "data": {
        "election_id": 1,
        "election_name": "KKM 2026",
        "election_status": "DRAFT",
        "voting_open": false,
        "started_at": null,
        "ended_at": "2026-04-13T06:00:00Z",
        "seconds_remaining": 604800,
        "minutes_remaining": 10080,
        "hours_remaining": 168,
        "days_remaining": 7,
        "voting_method": "50_PLUS_1",
        "threshold_percentage": 50,
        "total_eligible": 40,
        "total_voted": 3,
        "participation_percentage": 7.5
    }
}
```

**Response (400 Bad Request):**
```json
{
    "success": false,
    "message": "No active election found",
    "error": "no_active_election"
}
```

**Notes:**
- Countdown updates in real-time
- Shows remaining time in multiple formats
- Participation percentage updated after each vote
- Status: DRAFT → OPEN → CLOSED

---

### 6. Submit Vote

**Endpoint:** `POST /api/voting/submit`
**Authentication:** Required (Bearer token)
**Rate Limit:** 1 request per member

**Request Body:**
```json
{
    "member_nik": "1001000001",
    "candidate_id": 1,
    "site_id": 1
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Vote submitted successfully",
    "data": {
        "vote_id": 42,
        "member_nik": "1001000001",
        "candidate_id": 1,
        "candidate_name": "Drs. Agus Supriadi, MBA",
        "site_id": 1,
        "site_name": "Kantor Pusat",
        "department_id": 1,
        "department_name": "MANAGEMENT",
        "voted_at": "2026-04-06T14:30:00Z",
        "is_valid": true,
        "voucher_code": "VCH-2026-HQ01-20260406-1234567890AB",
        "voucher_status": "GENERATED",
        "voucher_claimed_by": null,
        "note": "Vote recorded successfully. Please save your voucher code."
    }
}
```

**Response (400 Bad Request):**
```json
{
    "success": false,
    "message": "Member NIK is required and must be numeric",
    "error": "validation_failed",
    "errors": {
        "member_nik": ["The member nik must be numeric"]
    }
}
```

**Response (409 Conflict - Already Voted):**
```json
{
    "success": false,
    "message": "Member has already voted",
    "error": "member_already_voted",
    "data": {
        "previous_vote_at": "2026-04-05T10:00:00Z",
        "previous_candidate_id": 2
    }
}
```

**Response (403 Forbidden - Election Closed):**
```json
{
    "success": false,
    "message": "Election is closed. Voting is no longer allowed",
    "error": "election_closed"
}
```

**Notes:**
- Triple-check implemented client-side before submission
- Voucher auto-generated with vote
- Voucher code format: VCH-YYYY-XXXXX-YYYYMMDD-RANDOM
- Member marked as has_voted = true
- Vote recorded in votes table with all metadata

---

## Election API

### 1. Get Current Election

**Endpoint:** `GET /api/election/current`
**Authentication:** None
**Rate Limit:** Unlimited

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Current election retrieved",
    "data": {
        "id": 1,
        "election_name": "KKM 2026",
        "election_status": "DRAFT",
        "started_at": null,
        "ended_at": "2026-04-13T06:00:00Z",
        "voting_method": "50_PLUS_1",
        "threshold_percentage": 50,
        "candidates_count": 3,
        "eligible_members": 40,
        "total_voted": 3
    }
}
```

---

### 2. Start Election (Admin Only)

**Endpoint:** `POST /api/election/start`
**Authentication:** Required (API token with ADMIN role)
**Rate Limit:** 1 per day

**Request Body:**
```json
{
    "election_id": 1
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Election started successfully",
    "data": {
        "id": 1,
        "election_name": "KKM 2026",
        "election_status": "OPEN",
        "started_at": "2026-04-06T14:30:00Z"
    }
}
```

**Notes:**
- Changes status from DRAFT → OPEN
- Records start time
- Voters can now cast votes

---

### 3. Close Election (Admin Only)

**Endpoint:** `POST /api/election/close`
**Authentication:** Required (API token with ADMIN role)
**Rate Limit:** 1 per day

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Election closed successfully",
    "data": {
        "id": 1,
        "election_name": "KKM 2026",
        "election_status": "CLOSED",
        "ended_at": "2026-04-06T15:30:00Z",
        "candidate_results": [
            {
                "id": 1,
                "name": "Drs. Agus Supriadi, MBA",
                "votes": 15,
                "percentage": 37.5,
                "winner": true
            }
        ]
    }
}
```

**Notes:**
- Changes status from OPEN → CLOSED
- Records end time
- Calculates final results
- No more votes accepted after closing

---

### 4. Update Election (Admin Only)

**Endpoint:** `PUT /api/election/update`
**Authentication:** Required (API token with ADMIN role)
**Rate Limit:** 10 per day

**Request Body:**
```json
{
    "election_id": 1,
    "voting_method": "50_PLUS_1",
    "threshold_percentage": 50
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Election updated successfully",
    "data": {
        "id": 1,
        "election_name": "KKM 2026",
        "voting_method": "50_PLUS_1",
        "threshold_percentage": 50
    }
}
```

**Notes:**
- Only DRAFT elections can be updated
- Must have at least 1 candidate
- Threshold must be 50-100%

---

## Candidates API

### 1. List Candidates

**Endpoint:** `GET /api/candidates`
**Authentication:** Optional
**Rate Limit:** Unlimited

**Query Parameters:**
- `page` - Pagination page (default: 1)
- `per_page` - Items per page (default: 15)
- `sort` - Sort field: `order_display`, `name`, `created_at`
- `order` - Sort direction: `asc`, `desc`

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "data": [
            {
                "id": 1,
                "order_display": 1,
                "name": "Drs. Agus Supriadi, MBA",
                "position": "Chairperson",
                "bio": "...",
                "created_at": "2026-04-06T12:00:00Z"
            }
        ],
        "pagination": {
            "current_page": 1,
            "last_page": 1,
            "per_page": 15,
            "total": 3
        }
    }
}
```

---

### 2. Create Candidate (Admin Only)

**Endpoint:** `POST /api/candidates`
**Authentication:** Required (API token with ADMIN role)
**Rate Limit:** 100 per day

**Request Body:**
```json
{
    "order_display": 1,
    "name": "Drs. Agus Supriadi, MBA",
    "position": "Chairperson",
    "bio": "Bio text",
    "vision": "Vision statement",
    "mission": "Mission statement",
    "department_id": 1
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "message": "Candidate created successfully",
    "data": {
        "id": 1,
        "order_display": 1,
        "name": "Drs. Agus Supriadi, MBA",
        "position": "Chairperson",
        "created_at": "2026-04-06T12:00:00Z"
    }
}
```

---

### 3. Update Candidate (Admin Only)

**Endpoint:** `PUT /api/candidates/{id}`
**Authentication:** Required (API token with ADMIN role)
**Rate Limit:** 100 per day

**Path Parameters:**
- `{id}` - Candidate ID

**Request Body:**
```json
{
    "name": "Updated Name",
    "position": "Updated Position",
    "vision": "Updated vision"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Candidate updated successfully",
    "data": {
        "id": 1,
        "name": "Updated Name",
        "updated_at": "2026-04-06T12:30:00Z"
    }
}
```

---

### 4. Delete Candidate (Admin Only)

**Endpoint:** `DELETE /api/candidates/{id}`
**Authentication:** Required (API token with ADMIN role)
**Rate Limit:** 50 per day

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Candidate deleted successfully",
    "data": null
}
```

**Notes:**
- Soft delete (keeps vote records)
- can_delete = false if votes exist

---

### 5. Upload Candidate Photo

**Endpoint:** `POST /api/candidates/{id}/upload-photo`
**Authentication:** Required (API token with ADMIN role)
**Content-Type:** multipart/form-data
**Rate Limit:** 50 per day

**Path Parameters:**
- `{id}` - Candidate ID

**Form Data:**
- `photo` - Image file (JPG, PNG, max 5MB)

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Photo uploaded successfully",
    "data": {
        "id": 1,
        "full_photo_url": "/candidates/agus-supriadi-1701234567.jpg",
        "file_size": 245687,
        "mime_type": "image/jpeg"
    }
}
```

**Notes:**
- Stored in public/candidates/
- Auto-resized to 400x500px
- Filename: {name}-{timestamp}.{ext}

---

## Statistics API

### 1. Voting Progress

**Endpoint:** `GET /api/stats/voting-progress`
**Authentication:** Optional (auth required for detailed breakdowns)
**Rate Limit:** Unlimited

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Voting progress retrieved",
    "data": {
        "total_members": 40,
        "voted_count": 12,
        "participation_percentage": 30.0,
        "not_voted_count": 28,
        "by_site": {
            "HEAD_OFFICE": {
                "total": 15,
                "voted": 5,
                "percentage": 33.3
            },
            "BRANCH_BDG": {
                "total": 13,
                "voted": 4,
                "percentage": 30.8
            },
            "BRANCH_SBY": {
                "total": 12,
                "voted": 3,
                "percentage": 25.0
            }
        },
        "by_department": {
            "MANAGEMENT": {
                "total": 5,
                "voted": 2,
                "percentage": 40.0
            }
        },
        "last_updated": "2026-04-06T14:30:00Z"
    }
}
```

---

### 2. Candidate Votes

**Endpoint:** `GET /api/stats/candidate-votes`
**Authentication:** Optional
**Rate Limit:** Unlimited

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "total_votes_cast": 12,
        "voting_method": "50_PLUS_1",
        "threshold_percentage": 50,
        "candidates": [
            {
                "id": 1,
                "order_display": 1,
                "name": "Drs. Agus Supriadi, MBA",
                "vote_count": 5,
                "percentage": 41.67,
                "threshold_met": false,
                "rank": 1
            },
            {
                "id": 2,
                "order_display": 2,
                "name": "Ir. Sri Wahyuni, M.M.",
                "vote_count": 4,
                "percentage": 33.33,
                "threshold_met": false,
                "rank": 2
            },
            {
                "id": 3,
                "order_display": 3,
                "name": "Dr. Muhammad Rizki Pratama",
                "vote_count": 3,
                "percentage": 25.0,
                "threshold_met": false,
                "rank": 3
            }
        ],
        "election_status": "DRAFT",
        "last_updated": "2026-04-06T14:30:00Z"
    }
}
```

---

### 3. Department Breakdown

**Endpoint:** `GET /api/stats/department-breakdown`
**Authentication:** Required (Bearer token)
**Rate Limit:** Unlimited

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "total_departments": 8,
        "departments": [
            {
                "id": 1,
                "name": "MANAGEMENT",
                "site_id": 1,
                "site_name": "HEAD_OFFICE",
                "total_members": 5,
                "voted_count": 2,
                "participation": 40.0,
                "vote_distribution": {
                    "candidate_1": 1,
                    "candidate_2": 1,
                    "candidate_3": 0
                }
            }
        ],
        "summary": {
            "total_members": 40,
            "total_voted": 12,
            "overall_participation": 30.0
        }
    }
}
```

---

## Voucher API

### 1. Verify Voucher

**Endpoint:** `GET /admin/voucher/verify/{code}`
**Authentication:** Required (API token with PANITIA/ADMIN role)
**Rate Limit:** Unlimited

**Path Parameters:**
- `{code}` - Voucher code

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Voucher is valid",
    "data": {
        "code": "VCH-2026-HQ01-20260406-1234567890AB",
        "status": "GENERATED",
        "member_nik": "1001000001",
        "member_name": "Budi Santoso",
        "candidate_id": 1,
        "candidate_name": "Drs. Agus Supriadi, MBA",
        "voted_at": "2026-04-06T14:30:00Z",
        "is_valid": true,
        "can_redeem": true
    }
}
```

**Response (404 Not Found):**
```json
{
    "success": false,
    "message": "Voucher not found",
    "error": "voucher_not_found"
}
```

**Response (409 Conflict - Already Redeemed):**
```json
{
    "success": false,
    "message": "Voucher has already been redeemed",
    "error": "voucher_already_redeemed",
    "data": {
        "redeemed_by": "panitia1@example.com",
        "redeemed_at": "2026-04-06T15:00:00Z"
    }
}
```

---

### 2. Redeem Voucher

**Endpoint:** `POST /admin/voucher/redeem`
**Authentication:** Required (API token with PANITIA/ADMIN role)
**Rate Limit:** 100 per 10 minutes

**Request Body:**
```json
{
    "code": "VCH-2026-HQ01-20260406-1234567890AB"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Voucher redeemed successfully",
    "data": {
        "code": "VCH-2026-HQ01-20260406-1234567890AB",
        "status": "REDEEMED",
        "member_nik": "1001000001",
        "member_name": "Budi Santoso",
        "redeemed_by": "panitia1@example.com",
        "redeemed_at": "2026-04-06T14:35:00Z"
    }
}
```

---

### 3. Get Voucher Statistics

**Endpoint:** `GET /admin/voucher/stats`
**Authentication:** Required (API token with PANITIA/ADMIN role)
**Rate Limit:** Unlimited

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "total_vouchers": 12,
        "by_status": {
            "GENERATED": 7,
            "CLAIMED": 3,
            "REDEEMED": 2
        },
        "by_candidate": {
            "Candidate 1": 5,
            "Candidate 2": 4,
            "Candidate 3": 3
        },
        "by_department": {
            "MANAGEMENT": 5,
            "FINANCE": 3,
            "OPERATIONS": 2,
            "HR": 2
        },
        "redemption_percentage": 16.7,
        "last_redeemed": "2026-04-06T14:35:00Z"
    }
}
```

---

### 4. List Vouchers

**Endpoint:** `GET /admin/voucher/list`
**Authentication:** Required (API token with PANITIA/ADMIN role)
**Rate Limit:** Unlimited

**Query Parameters:**
- `page` - Pagination page (default: 1)
- `per_page` - Items per page (default: 15)
- `status` - Filter by status: GENERATED, CLAIMED, REDEEMED
- `search` - Search by voucher code or member name

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "data": [
            {
                "code": "VCH-2026-HQ01-20260406-1234567890AB",
                "member_nik": "1001000001",
                "member_name": "Budi Santoso",
                "status": "REDEEMED",
                "redeemed_by": "panitia1@example.com",
                "redeemed_at": "2026-04-06T14:35:00Z"
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 15,
            "total": 12
        }
    }
}
```

---

## User API

### 1. Get User Profile

**Endpoint:** `GET /api/user`
**Authentication:** Required (Bearer token)
**Rate Limit:** Unlimited

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "nik": "1001000001",
        "name": "Budi Santoso",
        "email": "1001000001@example.com",
        "department_id": 1,
        "is_eligible": true,
        "has_voted": true
    }
}
```

---

### 2. Logout

**Endpoint:** `POST /api/logout`
**Authentication:** Required (Bearer token)
**Rate Limit:** Unlimited

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

**Notes:**
- Invalidates current token
- Frontend should clear stored token
- Redirect to login page

---

## Response Format

### Success Response (200 OK)

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        // Response payload
    }
}
```

### Error Response (400-500)

```json
{
    "success": false,
    "message": "Human-readable error message",
    "error": "machine_readable_error_code",
    "errors": {
        // Validation errors (if applicable)
        "field_name": ["Error message 1", "Error message 2"]
    }
}
```

### Pagination Response

```json
{
    "success": true,
    "data": {
        "data": [...],
        "pagination": {
            "current_page": 1,
            "last_page": 5,
            "per_page": 15,
            "total": 72,
            "from": 1,
            "to": 15
        }
    }
}
```

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `validation_failed` | 400 | Request validation failed |
| `email_invalid` | 400 | Invalid email format |
| `otp_invalid` | 400 | Invalid or expired OTP |
| `otp_max_attempts` | 429 | Too many OTP attempts |
| `member_not_found` | 404 | Member NIK not found |
| `member_not_eligible` | 403 | Member not eligible |
| `member_already_voted` | 409 | Member has already voted |
| `election_not_found` | 404 | Election not found |
| `no_active_election` | 400 | No active election |
| `election_closed` | 403 | Election is closed |
| `candidate_not_found` | 404 | Candidate not found |
| `voucher_not_found` | 404 | Voucher not found |
| `voucher_already_redeemed` | 409 | Voucher already redeemed |
| `unauthorized` | 401 | Authentication required |
| `forbidden` | 403 | Access denied |
| `rate_limit_exceeded` | 429 | Rate limit exceeded |
| `server_error` | 500 | Server error |

---

## Rate Limiting

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1617811200
```

### Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/voting/request-otp` | 3 | 1 minute |
| `/api/voting/verify-otp` | 5 | Per OTP |
| `/api/voting/submit` | 1 | Per member |
| `/api/candidates` (create) | 100 | 1 day |
| `/api/election` (admin) | 10 | 1 day |
| `/admin/voucher/redeem` | 100 | 10 minutes |
| Other endpoints | 500 | 1 hour |

---

**Last Updated:** April 6, 2026
**API Version:** 1.0
**Status:** ✅ Production Ready
