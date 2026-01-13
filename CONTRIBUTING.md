# Contributing to HIMAYA

Thank you for your interest in contributing to HIMAYA! We welcome contributions from the community to make government schemes more accessible to the people of Uttarakhand.

## Development Setup

1. **Prerequisites**
   - Node.js (v18 or higher recommended)
   - npm or yarn
   - Docker (optional, for containerized development)

2. **Installation**
   ```bash
   # Clone the repository
   git clone https://github.com/yourusername/HIMAYA.git
   cd HIMAYA

   # Install dependencies
   npm install
   ```

3. **Running Locally**
   
   **Standard Mode:**
   ```bash
   # Start backend and frontend (concurrently)
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

   **Docker Mode:**
   ```bash
   docker-compose up
   ```

4. **Running Tests**
   ```bash
   npm test
   ```

## Project Structure

- `backend/`: Express.js server and API
- `frontend/`: Vanilla JS frontend, CSS, and assets
- `tests/`: Unit tests (Jest)
- `.github/workflows/`: CI/CD configuration

## Coding Standards

- **JavaScript**: Use modern ES6+ features.
- **CSS**: Use CSS variables for theming. Respect the BEM-like naming convention.
- **i18n**: All user-facing text must be internationalized using `window.i18n.get()`. Add new strings to `frontend/js/i18n.js`.
- **Accessibility**: Ensure all interactive elements have ARIA labels and are keyboard navigable.

## Pull Request Process

1. Fork the repository and create a feature branch (`git checkout -b feature/amazing-feature`).
2. Commit your changes (`git commit -m 'Add some amazing feature'`).
3. Push to the branch (`git push origin feature/amazing-feature`).
4. Open a Pull Request.

## License

This project is licensed under the MIT License.
