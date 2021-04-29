module.exports = (ctx, next) => {
  ctx.type = "html"
  ctx.status = 200
  ctx.chunks = []
  let req = ctx.req
  let res = ctx.res

  ctx.write = (chunk) => {
    if (!chunk) {
      return ctx.end()
    }
    ctx.chunks.push(chunk)
    res.write(chunk)
  }

  ctx.end = (chunk) => {
    if (chunk) {
      ctx.write(chunk)
    }
    res.end(null)
  }
  return next()
}
