# Froglegs
This project is built upon NextJS with typescript enabled. For storing data we have selected postgres and drizzle as the ORM (Object-relational mapper). For managing UI we opted for Mantine due to it's extensive collection of components and ease to use. Auth is implemented according to Lucia-auth (This package has been deprecated hence all code lies in this project instead meaning we own it).

### Your environment



#### Required

- [Node.js](https://nodejs.org/en) - Obviously
- [Docker Desktop](https://www.docker.com/) - Needed for deploy to production

#### Recomended

- [VSCode](https://code.visualstudio.com/)
- [ESLint plugin](https://eslint.org/)
- [PostCSS plugin](https://postcss.org/)
- [Editorconfig plugin](https://editorconfig.org/) - Strongly recommnded. Very simple plugin that sets all basic formatting stuff such as indentations an more. Available as plugin for VSCode.
- [NVM](https://github.com/nvm-sh/nvm) - Strongly recommended, very convenient when managing a multitude of apps that may or may not be running om similar node-versions

## [Mantine (Components)](https://ui.mantine.dev/)

We have opted to use mantine for our components. For more info check out their docs.

## [@tabler/icons-react](https://tabler.io/docs/icons/libraries/react)

We use `@tabler/icons-react` instead of fontawesome for one reason and it's due to it being recommended in mantine documentation. This lib will get evaluated further ahead and if it come short it will probably be switched out.

## [Zod (Validation)](https://zod.dev/)

This project is setup with Zod, hence all validation of form/action data should go through it. Types/interface should be generated through this lib using type inference. This could be read about [here](https://zod.dev/?id=type-inference).

## [dayjs (Dates)](https://day.js.org/)

We use dayjs because that is what mantine uses under the hood. Having multiple date-libs just adds overhead, as long as it fulfills our demands there is no reason to add/switch to another.

## [docker (Deployment)](https://www.docker.com/)

We build our images locally and then upload them directly to server hence bypassing dockerhub. This is because to we dont want to make our images public. You will need to have docker installed on your local machine since it's used for creating the image. Scripts used for this will be described in another section in this README.

## [nvm](https://github.com/nvm-sh/nvm)

We make use of nvm in this app. This is because it simplifies managing different node version across multiple apps.
In `.nvmrc` you may see the chosen node-version for this app, it's important that this same version is also used in the docker-image. If one is updated so should the other. You can see the base-image used for docker in the `FROM` segment ath the top of the Dockerfile, here is how it could look `FROM node:22-alpine AS base`


## Building blocks
- NextJS as 
- Drizzle as ORM (Object-relational mapper) with postgress for db
- Mantine as component library


Built with SQLite.

- Password check with HaveIBeenPwned
- Email verification
- 2FA with TOTP
- 2FA recovery codes
- Password reset
- Login throttling and rate limiting

Emails are just logged to the console. Rate limiting is implemented using JavaScript `Map`.

## Initialize project

- Create a postgresql database and run migration towards it using `drizzle-kit`.
- Create a .env.local file.
- Set `DATABASE_URL` pointing towards the database you created in previous step.
- Generate a 128 bit (16 byte) string, base64 encode it, and set it as `ENCRYPTION_KEY`.


> You can use OpenSSL to quickly generate a secure key.
>
> ```bash
> openssl rand --base64 16
> ```

Install dependencies and run the application:

```
npm i
npm run dev
```

## Notes

- We do not consider user enumeration to be a real vulnerability so please don't open issues on it. If you really need to prevent it, just don't use emails.
- This example does not handle unexpected errors gracefully.
- There are some major code duplications (specifically for 2FA) to keep the codebase simple.
- TODO: You may need to rewrite some queries and use transactions to avoid race conditions when using MySQL, Postgres, etc.
- TODO: This project relies on the `X-Forwarded-For` header for getting the client's IP address.
- TODO: Logging should be implemented.
