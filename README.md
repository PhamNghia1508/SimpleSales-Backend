Project Description
Overview
A lightweight Web API system built with ASP.NET Core designed to handle a standard sales workflow. The project focuses on the relationship between user accounts (Account), purchase orders (Order), and item breakdowns (OrderDetail), while strictly adhering to high-performance SQL practices and clean software architecture.

Key Technical Features

3-Layer Architecture: Implementation of a clear separation between the Presentation Layer (API), Business Logic Layer (BLL), and Data Access Layer (DAL).
Repository Pattern & Data Mapping: Utilizing DAO (Data Access Object) for database interactions and DTO (Data Transfer Object) for secure and efficient data transfer between layers.
SQL Server Optimization:
Optimized query execution following the logical processing order (FROM -> JOIN -> WHERE -> ...).
High-performance SELECT statements (retrieving only necessary attributes and essential Foreign Keys).
Advanced data retrieval using Pagination (Offset-Fetch) and Top filters.
Balanced Indexing strategy to enhance read speed without compromising Insert/Update performance.
Data Integrity & Security:
Handling relational deletions with Restrict and Cascade logic.
Transaction management with Rollback capabilities to ensure data consistency.
Session management implementation using Cookies.
Database Schema

Account: Manages user credentials and profile information.
Order: Stores general order headers, timestamps, and status, linked to specific accounts.
OrderDetail: Handles line items within each order, managing quantities and pricing.
