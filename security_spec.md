# Security Specification: IGO Worker Network

## 1. Data Invariants

1. **Worker Area Boundary Constraint**: A Supervisor can only register and edit workers whose `homeState` and `homeDistrict` match their own assigned area (`assignedState` and `assignedDistrict`).
2. **Supervisor Data Ownership**: A Supervisor can only read/write workers where `supervisorId == request.auth.uid`.
3. **No Hard Deletes**: Worker profiles must never be deleted; they must be soft-deleted by setting `status` to `'archived'`.
4. **Role Isolation**: Only HR or Admins can create and manage `projects`. Supervisors cannot touch projects directly.
5. **Deployment Control**: HR can request deployments. Supervisors can confirm/cancel deployments for their own workers.
6. **Admin Read-All**: Admin has full read-access to everything, but can only write to `supervisors` and `verificationLog`.

## 2. The "Dirty Dozen" Malicious Payloads

The following malicious scenarios are blocked by our security rules:

1. **Identity Spoofing**: Supervisor A attempts to register a worker with `supervisorId: "supervisorB_uid"`.
2. **Area Escape**: Supervisor A (assigned to Tamil Nadu) attempts to register a worker with `homeState: "Kerala"`.
3. **Role Escalation**: Supervisor attempts to directly create a Project or update a Project's required skills.
4. **Unauthorized Reading**: Supervisor A attempts to fetch worker profiles belonging to Supervisor B.
5. **Malicious Deletion**: Any user attempts to perform a hard `delete` operation on a worker profile.
6. **State Shortcutting**: Supervisor attempts to update a project status to `'completed'`.
7. **Bypassing Verification**: Supervisor attempts to write directly to `verificationLog`.
8. **Malicious Deployment**: HR user attempts to set deployment status to `'confirmed'` without supervisor verification.
9. **Field Injection**: Supervisor attempts to inject custom admin properties (`isAdmin: true`) into their supervisor profile.
10. **Resource Poisoning**: Supervisor attempts to send a worker registration with a name that is 10MB in size.
11. **Anachronistic Timestamps**: A user sends a client-side manufactured past or future date for `createdAt` or `updatedAt` to forge logs.
12. **Double Placement Bypass**: Supervisor attempts to confirm a deployment for a worker they do not own.
