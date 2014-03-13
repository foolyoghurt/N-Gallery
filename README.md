# N-Gallery

A web photo gallery and picture viewer/browser using local image directory, powered by Node.js ([Demo Website](http://foolyoghurt.github.io/projects/n-gallery/demo/) )   
（中文文档见下文）

## Features
1. List pictures of a gallery fast and with beautiful web page
2. List galleries in the same local directory in one web page
3. If multiple directories specified, galleries in these directories are merged to diaplay in one web page
4. Some operations to images or galleries are supported
 >Select images or galleries  
 Select All  
 Cancel Select All  
 Reverse Selected  
 Delete Selected (move mode and delete mode are supported)   
 Show image properties  
5. Breadcrumb navigation is supported for the deep gallery path
6. Dynamically set or add the gallery directories
7. Zome in/out to display images
8. Smooth experience



## Quick Start 
### Install
```
$ npm install n-gallery -g
```

### Run
Use the `album_base_dirs` argument in the configuration file([see blow](#Configuration)) as base image directories by default
```
$ n-gallery
```
Specify image directories
```
$ n-gallery /tmp/pic/G1 /tmp/pic/G2
```
Specify image directories which are listed in a file, per directory name per line
```
$ n-gallery --file=/tmp/pic/img-dirs.txt
or
$ n-gallery -f /tmp/pic/img-dirs.txt

// /tmp/pic/img-dirs.txt
/tmp/pic/G1
/tmp/pic/G2
/tmp/pic/G3
```

Open generated website in default browser immediately. `-b` should be specified at last
```
$ n-gallery /tmp/pic/G1 -b
```

If you don't want to use the global `n-gallery` command to run, you can use `index.js` as the program entry. For example
```
n-gallery_home_path$ node index.js
n-gallery_home_path$ supervisor index.js
```

### Configuration
In the `lib/config/config.js` file, you can specify the server port number, image directory and so on. `album_base_dirs` must be specified for image directories unless you specify it from terminal command everry time
```
// lib/config/config.js
...
album_base_dirs: ["/tmp/gallery1, /tmp/gallery2"],
// If not set, will guess by the "Accept-Language" header field by default
// Only Chinese and English are supported now, and you can add a language file in the `doc/locales`
lang: 'en',
  
// Only IP in this list is allowed to do some operation on the images such as delete images
// or change image directory
ip_white_list: ['127.0.0.1'],

// del => delete files directly, mv => move files to a temporary directory 
delete_mode: 'mv',
  
// when delete mode is 'mv'
tmp_dir: '/tmp/n-gallery', 
  
// product, dev
env: 'product'
...
```

## How to Use
If specified directory **has subfolders** (galleries), webpage is shown as blow. Every element represents a subfolder (gallery). Click the `Start MultiSelect` on the right top of the web to start multiselect mode    

![Select](http://ww1.sinaimg.cn/mw690/6313f233tw1ee6id820sxj21hc0pln7g.jpg)

Delete the images in the selected subfolders

![Delete selected](http://ww4.sinaimg.cn/mw690/6313f233tw1ee6id0z65wj20vi0h1775.jpg)

If specified directory **doesn't have subfolders**, so a gallery is displayed directly  

![gallery](http://ww3.sinaimg.cn/mw690/6313f233tw1ee6icxly0wj21hc0plq8p.jpg)


# N-Gallery

一个基于Node.js的网页图片浏览器，利用本地图片文件夹生成网页 ([示例网站](http://foolyoghurt.github.io/projects/n-gallery/demo/))   

## 特性
1. List pictures of a gallery fast and with beautiful web page
2. List galleries in the same local directory in one web page
3. If multiple directories specified, galleries in these directories are merged to diaplay in one web page
4. Some operations to images or galleries are supported
 >Select images or galleries  
 Select All  
 Cancel Select All  
 Reverse Selected  
 Delete Selected  (move mode and delete mode are supported)   
 Show image properties  
5. Breadcrumb navigation is supported for the deep gallery path
6. Dynamically set or add the gallery directories
7. Zome in/out to display images
8. Smooth experience

## 快速向导 
### 安装
```
$ npm install n-gallery -g
```

### 运行
默认情况下，读取配置文件（[参见下文](#配置)）中`album_base_dirs`参数指定的目录作为图片文件夹生成网页
```
$ n-gallery
```
指定图片目录
```
$ n-gallery /tmp/pic/G1 /tmp/pic/G2
```
通过配置文件的方式指定图片目录，一行一个目录
```
$ n-gallery --file=/tmp/pic/img-dirs.txt
或者
$ n-gallery -f /tmp/pic/img-dirs.txt

// /tmp/pic/img-dirs.txt
/tmp/pic/G1
/tmp/pic/G2
/tmp/pic/G3
```

在输入完命令后，马上在默认浏览器中运行生成的网页。`-b` 参数应该在命令的最后指定
```
$ n-gallery /tmp/pic/G1 -b
```

If you don't want to use the global `n-gallery` command to run, you can use `index.js` as the program entry. For example
如果不想使用全局的`n-gallery`命令运行程序，可以用`index.js`作为程序入口，例如
```
n-gallery_home_path$ node index.js
n-gallery_home_path$ supervisor index.js
```

### 配置
在`lib/config/config.js`文件里，可以设置端口号、图片目录等。其中`album_base_dirs`必须设置，除非每次在终端运行命令的时候用参数指定
```
// lib/config/config.js
...
album_base_dirs: ["/tmp/gallery1, /tmp/gallery2"],
// 如果不设置，默认根据HTTP header中的『accept-language』来判断所使用的语言（只支持中文和英文 => zh, en）
// 可以在`doc/locales`中自己添加语言支持
lang: 'zh',
  
// 对于一些操作，如删除，更改图片目录等，只有在白名单中的IP才可以执行
ip_white_list: ['127.0.0.1'],

// del => 直接删除文件, mv => 将文件移到一个指定的临时文件夹下而不删除 
delete_mode: 'mv',
  
// mv模式下，指定的临时文件夹
tmp_dir: '/tmp/n-gallery', 
  
// product, dev
env: 'product'
...
```

## 使用教程
如果指定的目录中含**子目录**，那么网页的显示如下，每个元素都是一个子文件夹（相册）。点击右上角的`启动多选模式`以便可以进行多选，默认单击子文件夹的图片时在新窗口打开以该子文件夹为根目录的相册

![Select](http://ww1.sinaimg.cn/mw690/6313f233tw1ee6id820sxj21hc0pln7g.jpg)

删除选中的子文件夹中图片

![Delete selected](http://ww4.sinaimg.cn/mw690/6313f233tw1ee6id0z65wj20vi0h1775.jpg)

如果指定的目录中**不含子目录**，那么该页面就是一个相册   

![gallery](http://ww3.sinaimg.cn/mw690/6313f233tw1ee6icxly0wj21hc0plq8p.jpg)
