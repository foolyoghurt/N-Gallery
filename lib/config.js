var config = {
  name: 'N-Gallery',
  
  // use comma to separate multiple directories
  album_base_dirs: ['E:/tmp/pic'],
  count_per_page: "50",
  port: 8000,
  
  // If not set, will guess by the "Accept-Language" header field by default
  lang: 'en',
  
  // Only IP in this list is allowed to do some operation on the images such as delete images
  // or change image directory
  ip_white_list: ['127.0.0.1'],
  
  // del => delete files directly, mv => move files to a specified temporary directory 
  delete_mode: 'mv',
  
  // when delete mode is 'mv'
  tmp_dir: 'E:/tmp/n-gallery', 
  
  // production, development
  env: 'production'
};

module.exports = config;

