import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const projectRoot = resolve(process.cwd())
const projectName = basename(projectRoot)
const defaultCliPath = '/Applications/HBuilderX.app/Contents/MacOS/cli'
const cliPath = process.env.HBUILDERX_CLI || defaultCliPath

/**
 * 打印缺少 CLI 时的使用说明。
 */
function printGuide() {
  console.log('未检测到可用的 HBuilderX CLI。')
  console.log('')
  console.log('请先确认以下任一条件：')
  console.log(`1. 正式版 HBuilderX 已安装在默认路径：${defaultCliPath}`)
  console.log('2. 或者手动设置环境变量 HBUILDERX_CLI=/your/path/to/cli')
  console.log('')
  console.log('你也可以直接用 HBuilderX 打开当前项目并运行到微信开发者工具。')
}

/**
 * 执行一条 CLI 命令，并在失败时终止进程。
 */
function runCli(args) {
  const result = spawnSync(cliPath, args, {
    encoding: 'utf-8'
  })

  if (result.stdout) {
    process.stdout.write(result.stdout)
  }

  if (result.stderr) {
    process.stderr.write(result.stderr)
  }

  const output = `${result.stdout || ''}\n${result.stderr || ''}`

  if (output.includes('需要先登录') || output.includes('请先登录')) {
    console.error('')
    console.error('HBuilderX CLI 当前未登录。')
    console.error(`请先执行：${cliPath} user login --username 你的账号 --password 你的密码`)
    console.error('或者先打开 HBuilderX 图形界面完成登录，再重新执行 pnpm dev:mp-weixin。')
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

if (!existsSync(cliPath)) {
  printGuide()
  process.exit(1)
}

const wxAppId = process.env.WX_APPID || ''
const wxPrivateKey = process.env.WX_PRIVATEKEY || ''
const wxVersion = process.env.WX_VERSION || ''
const wxDescription = process.env.WX_DESC || 'uni-app x 基础项目构建'
const shouldUpload = process.env.WX_UPLOAD === 'true'

console.log(`使用 HBuilderX CLI 编译项目：${projectName}`)

runCli(['open'])
runCli(['project', 'open', '--path', projectRoot])

const publishArgs = ['publish', '--platform', 'mp-weixin', '--project', projectName]

if (shouldUpload) {
  if (!wxAppId || !wxPrivateKey) {
    console.error('当 WX_UPLOAD=true 时，必须同时提供 WX_APPID 与 WX_PRIVATEKEY。')
    process.exit(1)
  }

  publishArgs.push('--upload', 'true', '--appid', wxAppId, '--privatekey', wxPrivateKey, '--description', wxDescription)

  if (wxVersion) {
    publishArgs.push('--version', wxVersion)
  }
}

runCli(publishArgs)
