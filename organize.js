const fs = require('fs');
const path = require('path');

// Cấu hình các thư mục cần bỏ qua khi in (để nhìn cho gọn)
const IGNORE_DIRS = ['node_modules', '.git', '.next', 'dist', 'coverage'];

// Hàm in cấu trúc thư mục
function printTree(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach((file, index) => {
        if (IGNORE_DIRS.includes(file)) return;

        const isLast = index === files.length - 1;
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        console.log(`${prefix}${isLast ? '└── ' : '├── '}${file}`);

        if (stats.isDirectory()) {
            printTree(filePath, `${prefix}${isLast ? '    ' : '│   '}`);
        }
    });
}

// Hàm di chuyển file/thư mục an toàn
function moveItem(src, dest) {
    const srcPath = path.join(__dirname, src);
    const destPath = path.join(__dirname, dest);

    if (fs.existsSync(srcPath)) {
        // Tạo thư mục cha nếu chưa có
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        try {
            fs.renameSync(srcPath, destPath);
            console.log(`✅ Đã chuyển: ${src} -> ${dest}`);
        } catch (err) {
            // Nếu không chuyển được (ví dụ khác ổ đĩa), thử copy rồi xóa
            try {
                fs.cpSync(srcPath, destPath, { recursive: true });
                fs.rmSync(srcPath, { recursive: true, force: true });
                console.log(`✅ Đã chuyển (copy): ${src} -> ${dest}`);
            } catch (e) {
                console.error(`❌ Lỗi khi chuyển ${src}:`, e.message);
            }
        }
    }
}

// Hàm xóa file/thư mục
function deleteItem(item) {
    const itemPath = path.join(__dirname, item);
    if (fs.existsSync(itemPath)) {
        fs.rmSync(itemPath, { recursive: true, force: true });
        console.log(`🗑️  Đã xóa: ${item}`);
    }
}

// === BẮT ĐẦU THỰC HIỆN ===

console.log('qy📂 CẤU TRÚC TRƯỚC KHI SẮP XẾP:');
printTree(__dirname);
console.log('\n-----------------------------------\n');
console.log('🚀 BẮT ĐẦU CƠ CẤU LẠI DỰ ÁN...\n');

// 1. Tạo thư mục backend nếu chưa có
if (!fs.existsSync(path.join(__dirname, 'backend'))) {
    fs.mkdirSync(path.join(__dirname, 'backend'));
}

// 2. Di chuyển các Service vào Backend
const services = [
    'api-gateway', 
    'user-service', 
    'order-service', 
    'restaurant-service', 
    'delivery-service', 
    'payment-service',
    'seed.js' // File seed cũng thuộc backend
];
services.forEach(service => moveItem(service, `backend/${service}`));

// 3. Di chuyển các tài nguyên UI từ Root vào Frontend/src
// (Vì bạn đang dùng Vite, code nên nằm trong frontend/src)
const uiItems = [
    { src: 'components', dest: 'frontend/src/components' },
    { src: 'hooks', dest: 'frontend/src/hooks' },
    { src: 'lib', dest: 'frontend/src/lib' },
    { src: 'src/pages', dest: 'frontend/src/pages' }, // Chuyển pages cũ vào
    { src: 'src/styles', dest: 'frontend/src/styles' },
    { src: 'public', dest: 'frontend/public' }, // Merge public
    { src: 'components.json', dest: 'frontend/components.json' } // Config của shadcn
];

uiItems.forEach(item => moveItem(item.src, item.dest));

// 4. Dọn dẹp rác của Next.js và thư mục rỗng
const trash = [
    'app',              // Folder code của Next.js
    'next.config.mjs',  // Config Next.js
    'src',              // Folder src ở root sau khi đã chuyển hết ruột đi
    'tsconfig.json'     // File tsconfig ở root (Frontend đã có riêng)
];
trash.forEach(item => deleteItem(item));

console.log('\n-----------------------------------\n');
console.log('✨ CẤU TRÚC SAU KHI SẮP XẾP:');
printTree(__dirname);

console.log('\n✅ HOÀN TẤT! DỰ ÁN ĐÃ GỌN GÀNG.');