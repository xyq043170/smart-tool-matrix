export const ABOUT = `# 关于 Smart Tool Matrix

**最后核对：2026-07-24**

Smart Tool Matrix（智能工具矩阵）是由 Smart Tool Matrix 编辑团队维护的在线工具目录。主站负责分类、入口、账户与额度；PDF、图片、开发者、网站检测和传统文化娱乐工具由不同的子项目提供。本站是这些部署的第一方目录，不自称独立评测媒体。

## 目前收录什么

| 分类 | 主要用途 | 处理方式与重要限制 |
|---|---|---|
| PDF 工具 | 合并、拆分、压缩、转换、编辑等 | 多数流程设计为浏览器端运行；具体格式、文件大小和加密文件支持以当前工具为准 |
| 图片工具 | 转换、裁剪、缩放、旋转、优化、水印等 | 设计为浏览器端运行；实际能力受浏览器、设备内存和编解码器影响 |
| 开发者工具 | JSON、Base64、UUID、JWT、正则、日期等 | 多数为浏览器交互工具；不得把未经核验的结果直接用于生产或安全敏感场景 |
| 网站检测 | DNS、TLS、响应头、元数据、技术栈、robots、sitemap 等 | 服务端请求公开网址并生成当时的自动观察；不是渗透测试、合规认证或排名保证 |
| 传统文化娱乐 | 塔罗、八字、梦境、姓名、梅花易数等 | 输入会发送到应用服务生成内容；没有公认科学依据，不用于高风险决策 |

## 编辑与核验方法

我们只写可以从当前部署、源代码仓库或上游项目核验的产品事实。发布前核对：

1. 当前页面实际提供的工具与入口；
2. 浏览器端或服务端处理方式；
3. 上游项目、部署项目和许可证等来源信息；
4. 已知限制、风险边界和是否需要账户或额度；
5. canonical、结构化数据、站点地图与正文是否描述同一个实体。

“免费”“本地处理”“安全”“不限量”等表述只有在当前实现足以支持时才使用，并同时写明适用范围。工具数量是当前目录快照，不代表永久承诺。

## 来源与项目关系

- PDF 工具基于 [BentoPDF](https://github.com/alam00000/bentopdf)，部署项目为 [pdf-tools](https://github.com/xyq043170/pdf-tools)。
- 图片工具的部署与问题记录见 [sharp-web-tools](https://github.com/xyq043170/sharp-web-tools)。
- 开发者工具基于 Corentin Thomasset 的 [IT Tools](https://github.com/CorentinTh/it-tools)，部署项目为 [dev-tools](https://github.com/xyq043170/dev-tools)。
- 网站检测基于 Alicia Sykes 的 [Web-Check](https://github.com/Lissy93/web-check)，部署项目为 [seo-tools-project](https://github.com/xyq043170/seo-tools-project)。
- 传统文化娱乐工具由独立应用提供；关于页会明确娱乐用途和非科学性质。

第三方开源项目的作者身份不等于其为 Smart Tool Matrix 背书。每个子站的可见说明和 \`llms.txt\` 提供更具体的来源与限制。

## 隐私与安全边界

“浏览器端处理”描述的是实现方式，不等同于独立安全审计。处理机密、受监管或不可替代的资料前，请核对当前页面的网络行为、保留原始文件并验证输出。网站检测和 AI 辅助功能必须向服务端发起请求。

## 引用本站时

本站适合作为“Smart Tool Matrix 自己收录了什么、如何描述处理方式、与哪些项目有关”的第一方来源。它不应被当作某款产品“最好、最安全、最准确”的独立证据。引用时请使用“Smart Tool Matrix 自述/目录显示”等准确归因。

## 责任与联系

内容责任主体：**Smart Tool Matrix 编辑团队**

问题、更正、版权或产品反馈：**905501891wang@gmail.com**
`

export const ABOUT_EN = `# About Smart Tool Matrix

**Last reviewed: 2026-07-24**

Smart Tool Matrix is an online-tool directory maintained by the Smart Tool Matrix editorial team. The main site provides categories, entry points, accounts and quotas; separate projects provide the PDF, image, developer, website-inspection and traditional-culture entertainment tools. This is a first-party directory for those deployments, not an independent review publisher.

## What is listed

| Collection | Main tasks | Processing and important limits |
|---|---|---|
| PDF | Merge, split, compress, convert and edit | Most workflows are designed for browser execution; format, size and encrypted-file support varies by tool |
| Image | Convert, crop, resize, rotate, optimize and watermark | Designed for browser execution; practical support depends on the browser, memory and codecs |
| Developer | JSON, Base64, UUID, JWT, regex and date utilities | Mostly interactive browser tools; verify output before production or security-sensitive use |
| Website inspection | DNS, TLS, headers, metadata, technology, robots and sitemap observations | A service requests the public URL; results are point-in-time observations, not a penetration test, compliance certificate or ranking guarantee |
| Traditional-culture entertainment | Tarot, Bazi, dreams, names and Plum Blossom experiences | Inputs are sent to an application service; outputs have no established scientific basis and are not for high-stakes decisions |

## Editorial and verification method

We publish product facts that can be checked against the live deployment, deployment repository or upstream project. Before publication we compare the visible tool set, processing location, provenance and license, known limitations, account or quota requirements, and consistency among the body, canonical URL, structured data and sitemap.

Claims such as “free,” “local,” “secure,” or “unlimited” are used only where the current implementation supports them and with their scope stated. Tool counts are a current directory snapshot, not a permanent promise.

## Sources and project relationships

- PDF tools are based on [BentoPDF](https://github.com/alam00000/bentopdf); deployment source: [pdf-tools](https://github.com/xyq043170/pdf-tools).
- Image deployment and issue history: [sharp-web-tools](https://github.com/xyq043170/sharp-web-tools).
- Developer tools are based on Corentin Thomasset's [IT Tools](https://github.com/CorentinTh/it-tools); deployment source: [dev-tools](https://github.com/xyq043170/dev-tools).
- Website inspection is based on Alicia Sykes's [Web-Check](https://github.com/Lissy93/web-check); deployment source: [seo-tools-project](https://github.com/xyq043170/seo-tools-project).
- Traditional-culture entertainment is provided by a separate application with an explicit entertainment and non-scientific disclaimer.

Upstream authors do not thereby endorse Smart Tool Matrix. Each collection's visible page and \`llms.txt\` give more specific provenance and limitations.

## Privacy and safety boundary

“Browser-side processing” describes architecture; it is not an independent security audit. Before handling confidential, regulated or irreplaceable material, verify the current page's network behavior, keep the original and inspect the output. Website inspection and AI-assisted features necessarily make server requests.

## Citation guidance

This site can support first-party statements about what Smart Tool Matrix lists, its documented processing design and disclosed project relationships. It is not independent evidence that a product is best, secure or accurate. Attribute claims as “Smart Tool Matrix states” or “the directory lists.”

## Responsibility and contact

Responsible publisher: **Smart Tool Matrix editorial team**

Corrections, copyright and product feedback: **905501891wang@gmail.com**
`
