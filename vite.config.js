import { defineConfig } from 'vite';

export default defineConfig({
    base: './',   // GitHub Pages 서브디렉토리 배포 대응 (상대 경로)
    server: {
        host: true,
        port: 5173,
        open: true,
        strictPort: true
    }
});
