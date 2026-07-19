npx sequelize-cli db:migrate
npx sequelize-cli db:migrate --to migrate_users.js

### Bước 2: Setup cho Dự án 2 (Gọi trực tiếp IP)
Vì dự án này không đi qua Nginx mà tool hoặc client sẽ gọi thẳng bằng http://<IP_VPS>:<PORT_DA2>, bạn chỉ cần mở cổng trên tường lửa của VPS.

Giả sử dự án 2 chạy ngầm ở port 8081:

Mở Terminal trên VPS và chạy lệnh: sudo ufw allow 8081/tcp

(Nếu nhà cung cấp VPS của bạn có bảng quản lý Firewall trên Web, hãy vào đó mở thêm port 8081 cho phép kết nối Inbound/Chiều vào).