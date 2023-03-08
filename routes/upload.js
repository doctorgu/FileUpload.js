var express = require("express");
var router = express.Router();
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const dir = "public/files";

router.use(fileUpload({ defCharset: "utf8", defParamCharset: "utf8" }));

async function moveFiles(files) {
  for (const props of Object.values(files)) {
    // Array if multiple attribute used in like <input type="file" multiple />
    const list = props.length ? props : [props];
    for (const item of list) {
      const { name: fileName, mv } = item;
      const fullPath = `${dir}/${fileName}`;
      console.log(fullPath);
      const err = await mv(fullPath);
      if (err) return { success: false, msg: err };
    }
  }

  return { success: true, msg: "" };
}

// router.post("/", async function (req, res) {
//   if (!req.files || Object.keys(req.files).length === 0) {
//     return res.status(400).send("No files were uploaded.");
//   }

//   const { success, msg } = await moveFiles(req.files);
//   if (!success) {
//     return res.status(500).send(msg);
//   }

//   return res.redirect("/");
// })

async function moveFiles2(files) {
  const results = [];

  if (!files || Object.keys(files).length === 0) {
    const result = { error: "No files were uploaded." };
    return [result];
  }

  const dir = "public/files";
  // Array if multiple attribute used in like <input type="file" multiple />
  const list = Object.values(files).flatMap((props) => props);
  for (const item of list) {
    const result = {};

    const { name: fileName, mimetype: type, size, mv } = item;
    const fullPath = `${dir}/${fileName}`;

    result["name"] = fileName;
    result["type"] = type;
    result["size"] = size;
    result["deleteType"] = "DELETE";
    result["deleteUrl"] = `/upload?name=${fileName}`;

    const error = await mv(fullPath);
    if (error) {
      results.push(result);
      break;
    }

    results.push(result);
  }

  return results;
}

router.get("/", async function (req, res) {
  return res.send("");
});
router.post("/", async function (req, res) {
  const results = await moveFiles2(req.files);
  const ret = { files: results };
  return res.status(200).send(ret);
});
router.delete("/", async function (req, res) {
  /*{"files": [
  {
    "picture1.jpg": true
  },
  {
    "picture2.jpg": true
  }
]}*/
  const name = req.query.name;
  const fullPath = path.join(dir, name);
  const files = [];
  try {
    fs.rmSync(fullPath);
    files.push({ [name]: true });
  } catch (ex) {
    files.push({ [name]: false });
  }
  return res.status(200).send({ files });
});

module.exports = router;
