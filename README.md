# NovelNest Order Service

## Project Description

The **NovelNest Order Service** is a microservice responsible for managing orders in the NovelNest application. NovelNest is a scalable platform for book enthusiasts to buy, sell, and exchange books. This service handles order creation, updates, and status management, ensuring seamless transactions between buyers and sellers.

## Tech Stack

- **Node.js**: Backend runtime environment
- **Express.js**: Web framework for building APIs
- **Prisma**: ORM for database interactions
- **PostgreSQL**: Relational database
- **RabbitMQ**: Message broker for asynchronous communication
- **Docker**: Containerization platform
- **Kubernetes**: Orchestration for deploying and managing services

## Project Structure

```
order-service/
├── docker-compose.yaml       # Docker Compose configuration
├── Dockerfile                # Docker image definition
├── package.json              # Node.js dependencies and scripts
├── prisma/                   # Prisma schema and migrations
│   ├── schema.prisma         # Database schema definition
│   └── migrations/           # Database migration files
├── src/                      # Source code
│   ├── index.ts              # Entry point of the service
│   ├── middleware.ts         # Middleware definitions
│   ├── rabbitmq.ts           # RabbitMQ integration
│   ├── routes/               # API route handlers
│   └── types.ts              # TypeScript type definitions
└── tsconfig.json             # TypeScript configuration
```

## Features

- Order management: Create, update, and retrieve orders
- Integration with RabbitMQ for event-driven communication
- PostgreSQL database for persistent storage
- Prisma ORM for database operations

## Prerequisites

Ensure the following tools are installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Kind](https://kind.sigs.k8s.io/) (optional for local Kubernetes cluster)

## Local Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/NovelNestHQ/order-service
   cd NovelNestHQ/order-service
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up the database:

   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. Start the service:

   ```bash
   npm run dev
   ```

The service will be running at `http://localhost:5010`.

## Deployment to Kubernetes

1. Ensure your Kubernetes cluster is running and `kubectl` is configured.

2. Apply the Kubernetes manifests:

   ```bash
   kubectl apply -f ../k8s-manifests/order-service/order-service.yaml
   ```

3. Verify the deployment:

   ```bash
   kubectl get pods
   ```

4. Access the service:
   - Use `kubectl port-forward` to forward the service port locally:

     ```bash
     kubectl port-forward svc/order-service 5010:5010
     ```

   - The service will be accessible at `http://localhost:5010`.

## Environment Variables

The following environment variables are required:

- `DATABASE_URL`: Connection string for the PostgreSQL database
- `PORT`: Port on which the service runs (default: 5010)

## Sample Data / Testing

- Use the provided Prisma migrations to initialize the database schema.
- Test the API endpoints using tools like [Postman](https://www.postman.com/) or [cURL](https://curl.se/).

## Cleanup

To delete the Kubernetes resources:

```bash
kubectl delete -f ../k8s-manifests/order-service/order-service.yaml
```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.
