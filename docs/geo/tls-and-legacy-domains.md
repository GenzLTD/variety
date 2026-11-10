# TLS 与旧域收敛（P3 文档；不擅自改旧云）

| 项 | 现状 / 建议 |
|----|-------------|
| 权威域 | `https://szbolent.com`（www 同站） |
| 现役橱窗 nginx（仓内） | `deploy/nginx/szbolent.com.conf` — 新机用；**勿**与根目录遗留 `nginx.conf` 混淆 |
| 根目录 `nginx.conf` | 由 `contracts/entry.json` → `gen-entry` 生成的**阿里旧书店机**产物叙事；**不要**安装到新机橱窗 |
| TLS | 新机契约曾标明证书未落盘前不写 443；证书就绪后再：443 + ACME、HTTP→HTTPS，HSTS 冷静期后再开 |
| 旧域 `.cn` / `.com.cn` | 若仍解析：运维另案 301 到 `szbolent.com` 对应路径；本仓只声明与检测，**不** SSH 旧云 |
| ban-list | 禁止对阿里 `47.115.*`、旧腾讯 `1.14.*` 等退役机做 GEO 触发的 deploy |

本文件只指导运维决策；**无授权不部署、不碰 ban-list 主机**。