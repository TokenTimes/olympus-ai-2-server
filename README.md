## Backend - Olympus AI

## Prerequisites

- Ensure Docker is installed and running on your system.  
  Refer to the official Docker installation guide:  
  [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)

---

### Setup Instructions

#### Step 1: Clone the Repository

```bash
git clone https://github.com/TokenTimes/olympus-ai-2-server.git
cd olympus-ai-2-server
```

#### Step 2: Install Dependencies

Run the following command to install all required dependencies:

```bash
npm install
```

#### Step 3: Environment Variables

Create a `.env` file in the `olympus-ai-2-server` directory with the following structure:

```
PORT=
MONGODB_CONNECTION_STRING=
JWT_SECRET_KEY=
JWT_EXPIRY=

REDIS_HOST=
REDIS_PORT=

SENDGRID_API_KEY=
SENDGRID_EMAIL=

ENCRYPTION_ALGORITHM=
ENCRYPTION_PASSWORD=
ENCRYPTION_SALT=
ENCRYPTION_IV_LENGTH=

SALT=

CMC_API_KEY=
BOARDROOM_API_KEY=
ETHERSCAN_API_KEY=

ADMIN_EMAIL=
ADMIN_PASSWORD=

TWO_FA_ISSUER=
AI_URL=
```

#### Step 4: Running the Application

Build and start containers in development mode:

```bash
npm run start
```

Stop containers running in development mode:

```bash
npm run stop
```

Show logs for the backend Docker container:

```bash
docker logs prodex_application -f
```

Access the backend Docker container:

```bash
docker exec -it prodex_application bash
```

Access the MongoDB Docker container:

```bash
docker exec -it prodex_mongo_application bash
```

#### Step 5: Check if the Server is Running

Use the following command to check if the server is running by accessing the logs:

```bash
docker exec -it prodex_application bash
```

```
Replace `<PORT>` with the port specified in the `.env` file. You should see a response confirming the server is running.
```
