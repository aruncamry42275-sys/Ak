# Security Specification

## Data Invariants
1. A driver credential record must map to a valid `driverId`.
2. Driver credentials should only be read, created, or updated by Authenticated Admin users.
3. Users of role `driver` must not be able to read or modify other drivers' credentials or modify their own role.

## Dirty Dozen Payloads (Rule Violators)
1. Creating a credential with a random non-alphanumeric `driverId`.
2. Unauthenticated user trying to read driver credentials.
3. Authenticated driver trying to read another driver's credentials.
4. Authenticated driver trying to write/create a credential record.
5. Updating a credential record to change the `driverId` (immutable).
6. Setting a password with a weight exceeding 100 characters.
7. Injecting non-string values into `email` or `password`.
8. Setting `role` to `admin` by a driver user.
9. Deleting driver credentials as a driver.
10. Creating a credential record with missing required field `password`.
11. Bypassing validation with empty `fileNumber` field name.
12. Attempting a batch operation representing an orphaned credential.

## Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global Safety Net
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }

    function incoming() {
      return request.resource.data;
    }

    function existing() {
      return resource.data;
    }

    function isEmailVerified() {
      return request.auth.token.email_verified == true;
    }

    function isValidCredential(data) {
      return data.driverId is string 
          && data.driverId.size() <= 128
          && data.fileNumber is string
          && data.fileNumber.size() <= 50
          && data.password is string
          && data.password.size() >= 1
          && data.password.size() <= 100
          && (data.email == null || (data.email is string && data.email.size() <= 100))
          && (data.name == null || (data.name is string && data.name.size() <= 100))
          && (data.role == null || (data.role is string && (data.role == 'driver' || data.role == 'admin')));
    }

    match /driverCredentials/{driverId} {
      allow get: if isSignedIn();
      allow list: if isSignedIn() && resource.data.driverId == request.auth.uid;
      allow create: if isSignedIn() 
                    && isValidId(driverId) 
                    && request.resource.data.keys().hasAll(['driverId', 'fileNumber', 'password'])
                    && request.resource.data.keys().size() >= 3
                    && isValidCredential(incoming());
      allow update: if isSignedIn() 
                    && isValidId(driverId) 
                    && isValidCredential(incoming())
                    && incoming().driverId == existing().driverId;
      allow delete: if isSignedIn();
    }
  }
}
```
