# envault

> Secure .env file manager with team-sharing support and encrypted local storage.

---

## Installation

```bash
npm install -g envault
```

---

## Usage

Initialize a new vault in your project:

```bash
envault init
```

Push your `.env` file to the shared vault:

```bash
envault push --env .env --project my-app
```

Pull the latest secrets to your local environment:

```bash
envault pull --project my-app --out .env
```

Add a team member:

```bash
envault invite user@example.com --project my-app
```

All secrets are encrypted at rest using AES-256 before being stored or transmitted. Each team member authenticates with their own key pair — no plaintext secrets are ever shared directly.

---

## Configuration

On first run, `envault init` creates a `.envault.json` config file in your project root. You can also set a global config at `~/.envault/config.json`.

---

## Requirements

- Node.js >= 18
- TypeScript >= 5.0

---

## License

[MIT](./LICENSE)

---

> **Note:** Never commit your `.env` files to version control. Add `.env` to your `.gitignore` and let envault handle the rest.