---
trigger: always_on
---

# Backend Project Rules (`cal_backend`)

This file contains the specific rules and tech stack details for the `cal_backend` project. You MUST FOLLOW these rules when writing or modifying code in this directory.

## 🛠️ Tech Stack Overview

- **Core Framework:** NestJS (v11)
- **Language:** TypeScript
- **Database ORM:** TypeORM (v0.3.x)
- **Database Driver:** MySQL (`mysql2`)
- **Authentication:** Passport, JWT (`@nestjs/jwt`, `@nestjs/passport`), Bcrypt
- **Validation:** `class-validator`, `class-transformer`
- **API Documentation:** OpenAPI / Swagger (`@nestjs/swagger`)
- **File Uploads:** Multer (`@types/multer`)
- **Testing:** Jest, Supertest

## 📏 Core Development Rules

### 1. NestJS Architecture

- **Modularity:** Keep features separated into distinct modules. Every major feature should have its own `Module`, `Controller`, and `Service`.
- **Dependency Injection:** Always use NestJS's dependency injection container. Do not instantiate services manually using `new`.
- **DTOs (Data Transfer Objects):** Always define DTOs for incoming requests (POST, PUT, PATCH). Keep them in a `/dto` folder inside the feature module.

  ```typescript
  import { IsString, IsNotEmpty } from 'class-validator';
  import { ApiProperty } from '@nestjs/swagger';

  export class CreateExampleDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;
  }
  ```

### 2. Database & TypeORM

- **Entities:** Define database schemas using TypeORM `@Entity()` decorators.
- **Repositories:** Inject TypeORM repositories (`@InjectRepository(EntityName)`) into services for database operations. Avoid using global Entity Managers unless executing complex transactions.
- **Relationships:** Clearly define relations (`@OneToMany`, `@ManyToOne`, etc.) in the entity classes.

### 3. Validation & Serialization

- **Class Validator:** Use `class-validator` decorators on DTOs to ensure data integrity. The `ValidationPipe` should be enabled globally.
- **Class Transformer:** Use `@Type(() => Number)` or similar decorators from `class-transformer` if type casting is required on incoming payloads.

### 4. Authentication & Authorization

- **Guards:** Use NestJS AuthGuards (e.g., `AuthGuard('jwt')`) to protect private endpoints.
- **User Decorator:** Use a custom `@GetUser()` decorator to extract the authenticated user from the request object rather than accessing `req.user` directly everywhere.
- **Passwords:** Passwords must ALWAYS be hashed using `bcrypt` before saving to the database.

### 5. API Documentation (Swagger)

- **Decorators:** Use `@ApiTags('Feature')`, `@ApiOperation()`, and `@ApiResponse()` on controllers and methods to auto-generate OpenAPI documentation.
- **DTO Properties:** Add `@ApiProperty()` to DTO fields so they appear correctly in the Swagger UI.

### 6. Error Handling

- **Exceptions:** Throw standard NestJS HTTP exceptions (e.g., `NotFoundException`, `BadRequestException`, `UnauthorizedException`) instead of generic Node errors where appropriate.
- **Clear Messages:** Provide clear and actionable error messages in exceptions.

### 7. File Uploads (Multer)

- **Interceptors:** Use `FileInterceptor` or `FilesInterceptor` on routes that accept multipart/form-data.
- **Storage:** Configure Multer storage options safely, typically saving temporarily into a specific folder or memory before moving.

### 8. Code Quality & Formatting

- **Clean Code:** Methods should do one thing and do it well. Extract complex business logic into private service methods.
- **TypeScript:** Avoid `any`. Use strict typing for function parameters and return types.
- **Linting:** Code must pass the configured ESLint and Prettier rules (`npm run lint`, `npm run format`).

---

> **🧠 AI BEHAVIORAL DIRECTIVE:**
> When acting within this directory, you assume the role of an **Expert NestJS Developer**. You must craft clean, modular, scalable backend code that strictly adheres to the architectural patterns of NestJS and TypeORM, ensuring robust validation and accurate API documentation.
