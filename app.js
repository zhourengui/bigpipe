const Koa = require("koa")
const app = new Koa()
const path = require("path")
const Router = require("@koa/router")
const fs = require("fs")
const co = require("co")
const render = require("koa-swig")

const router = new Router()

app.context.render = co.wrap(
  render({
    root: path.join(__dirname, "views"),
    autoescape: true,
    // SSR最关键的地方
    cache: false,
    ext: "html",
    writeBody: false,
  })
)

const sleep = (wait) => new Promise((resolve) => setTimeout(resolve, wait))

async function renderPart1() {
  // 可以通过写插件获取
  const json = {
    html: "我是第一次输出的内容<br/>",
    css: "",
    js: "",
  }
  await sleep(2000)
  return `
    <script>
      addHTML("#part1", "我是第一次输出的内容<br/>")
    </script>
  `
}

async function renderPart2() {
  await sleep(2000)
  return `
    <script>
      addHTML("#part2", "我是第二次输出的内容<br/>")
    </script>
  `
}

// 1、可以在预渲染手段使用
router.get("/", async (ctx, next) => {
  // 需要修正请求头否则会出现404
  ctx.status = 200
  ctx.type = "html"
  // 通过流方式读取, 大文件的静态文件 直接输出，这样就开启了bigpipe
  const file = fs.readFileSync("./views/index.html")
  ctx.res.write(file)
  ctx.res.end()
})

// 2、通过流，读多少，吐多少
// 最优雅的方式
router.get("/stream", async (ctx, next) => {
  // 需要修正请求头否则会出现404
  ctx.status = 200
  ctx.type = "html"
  // 通过流方式读取, 大文件的静态文件 直接输出，这样就开启了bigpipe
  function createSSRStreamPromise() {
    return new Promise((resolve, reject) => {
      const rs = fs.createReadStream("./views/stream.html")
      rs.on("error", (err) => reject(err))
      rs.pipe(ctx.res)
    })
  }
  await createSSRStreamPromise()
})

// 3、通过流，读多少，吐多少
router.get("/stream1", async (ctx, next) => {
  // 需要修正请求头否则会出现404
  ctx.status = 200
  ctx.type = "html"
  // 通过流方式读取, 大文件的静态文件 直接输出，这样就开启了bigpipe
  function createSSRStreamPromise() {
    return new Promise((resolve, reject) => {
      const rs = fs.createReadStream("./views/stream1.html")
      rs.on("data", (chunk) => ctx.res.write(chunk))
      rs.on("end", () => resolve())
    })
  }
  await createSSRStreamPromise()
  ctx.res.end()
})

// 4、部分直出，其他内容动态渲染
router.get("/dynamic", async (ctx, next) => {
  ctx.status = 200
  ctx.type = "html"
  // 通过流方式读取, 大文件的静态文件 直接输出，这样就开启了bigpipe
  const file = fs.readFileSync("./views/index.html")
  ctx.res.write(file)
  ctx.res.write(await renderPart1())
  ctx.res.write(await renderPart2())
  ctx.res.end()
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(3333)
