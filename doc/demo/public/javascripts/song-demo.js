/** ========================================================================
 * Created by song on 14-1-22.
 * =========================================================================
 * 该类用于选中页面上的元素，支持单选、单个取消、多选（多次单选），全选、反选、全部取消。
 * 支持对单个或多个元素及其对应的本地文件进行删除操作，支持更新徽标。
 * ========================================================================= */

var SelectItems = (function(global) {
  "use strict";

  function SelectItems(selector, id_prefix) {

    // 选中的元素的id属性中的数字
    this.itemSelected = [];

    // id前缀(类型)
    this.id_prefix = this.type = id_prefix;

    // 需要用到的各个jquery选择器，带_class后缀的仅为类名，不带.号
    this.sel = {
      'item': selector['item'],
      'wrapper': selector['wrapper'],
      'selected_class': selector['selected_class'],
      'wrapper_selected_class': 'img-wrapper-selected',
      'del_pop': selector['del_pop'],
      'badge_selected': selector['badge_selected'],
      'badge_total': selector['badge_total']
    };
    this.selector = this.sel['item'];

    // 将实际的DOM节点绑定到对应的操作上
    this.oprationSelector = null;

    // 元素总数（包括选中和未选中的）
    this.itemTotal = $(this.selector).length;

    // 错误消息
    this.error_msg = {
      0: '未知错误',
      1: '未选中任何元素'
    }
  }

  SelectItems.prototype.selectOne = function(selector, shiftKey) {

    // 选中/取消一个元素
    // ==============

    var _this = this,
      $el = $(selector),
      selClass = _this.sel['selected_class'],
      wrapperSelClass = _this.sel['wrapper_selected_class'],

      // 只存id中的数字
      id = +$el.attr('id').slice(_this.id_prefix.length),

      // 上一次单击选中的元素
      last = _this.itemSelected[_this.itemSelected.length - 1];

    // 按住shift键+单击，连续多选。如果之前并未有任何元素被选中，则作为普通的选中事件
    if (shiftKey && last !== undefined) {
      var start = Math.min(last, id),
        end = Math.max(last, id),
        count = 0;

      for (var i = start; i <= end; i++) {
        if (_this.itemSelected.indexOf(i) != -1) continue;
        _this.itemSelected.push(i);
        count++;
        $('#' + _this.id_prefix + i).addClass(selClass);
        $('#' + _this.id_prefix + i).parent().addClass(wrapperSelClass);
    }

    } else {
      if (!$el.hasClass(selClass)) {
        $el.addClass(selClass);
        $el.parent().addClass(wrapperSelClass);
        _this.itemSelected.push(id);
      } else {
        $el.removeClass(selClass);
        $el.parent().removeClass(wrapperSelClass);
        _this.itemSelected.splice(_this.itemSelected.indexOf(id), 1);
      }
    }

    _this.updateBadge();

  };

  SelectItems.prototype.reverseSelect = function() {

    // 反选
    // ===

    var _this = this,
      selClass = this.sel['selected_class'],
      wrapperSelClass = _this.sel['wrapper_selected_class'],
      hash = {};

    // 取消已选
    this.itemSelected.forEach(function(id) {
      $('#' + _this.id_prefix + id).removeClass(selClass);
      $('#' + _this.id_prefix + id).parent().removeClass(wrapperSelClass);
      hash[+id] = true;
    });
    this.itemSelected.length = 0;

    // 增加未选
    $(this.selector).each(function () {
      var id = $(this).attr('id');
      id = parseInt(/\D*(\d+)/.exec(id)[1]);
      if (!hash[id]) {
        $('#' + _this.id_prefix + id).addClass(selClass);
        $('#' + _this.id_prefix + id).parent().addClass(wrapperSelClass);
        _this.itemSelected.push(id);
      }
    });
    this.updateBadge();

  };

  SelectItems.prototype.allSelect = function() {

    // 全选
    // ===

    var _this = this;

    // 已选中的清除掉
    this.itemSelected.length = 0;
    $(this.selector).each(function () {
      $(this).addClass(_this.sel['selected_class']);
      $(this).parent().addClass(_this.sel['wrapper_selected_class']);
      _this.itemSelected.push(+$(this).attr('id').slice(_this.id_prefix.length));
    });
    this.updateBadge();

  };

  SelectItems.prototype.cancelAllSelect = function() {

    // 取消全部选择
    // ==========

    var _this = this;

    $(this.selector).each(function () {
      $(this).removeClass(_this.sel['selected_class']);
      $(this).parent().removeClass(_this.sel['wrapper_selected_class']);
    });
    this.itemSelected.length = 0;
    this.updateBadge();

  };

  SelectItems.prototype.deleteOne = function(selector, callback) {

    // 删除单个文件（网页上元素和本地文件均删除）
    // ===================================

    var _this = this,
      $img = $(selector['item']),
      success = true;

    $img.closest(_this.sel['wrapper']).hide('500', function () {
      this.remove();
    });

    _this.itemTotal--;
    _this.updateBadge();

    return success;

  };

  /**
   *
   * @param callback  将单个的item中需要的信息提取出来，以便利用ajax发送给服务器
   * @param query     Ajax请求中query string里的字段名，如: a?foo=bar，此时query为foo
   * @param type      album, pic等类型，每种类型对应的操作有一些小区别
   * @returns {boolean}
   */
  SelectItems.prototype.deleteSelect = function(callback, query, type) {

    // 删除选中项
    // =========

    var _this = this,
      popover = this.sel['del_pop'],
      wrapper = this.sel['wrapper'],
      items = this.itemSelected.map(callback),
      ajaxData = {},
      success = false;

    if (!this.itemSelected.length) {
      if (popover) {
        _this.popover(popover, 2000, {'data-content': _this.error_msg[1]});
      }

      return false;
    }

    ajaxData[query] = JSON.stringify(items);
    var last = _this.itemSelected[_this.itemSelected.length - 1],
      nextLast = $('#' + _this.id_prefix + last).closest(wrapper).next();

    _this.itemSelected.forEach(function (id) {
      var $delItem = $('#' + _this.id_prefix + id).closest(wrapper);

      if (type == 'album') {

        // Duitang Waterfall Woo
        var ht = $delItem.data('ht'),
          cls = $delItem.attr('class'),
          tp = parseInt($delItem[0].style.top),
          m = /\bsc(\d+) \bco(\d+)/i.exec(cls),
          sc = m[1],
          co = m[2];

        $.Woo.resetCol(-ht, sc, co, tp);
      }

      $delItem.remove();
    });

    _this.itemTotal -= _this.itemSelected.length;
    _this.itemSelected.length = 0;

    // 页面跳转到被删的最后一个元素的下一个
    if (type == 'pic') {

      // 不是最后一个元素
      if (nextLast.length) {
        $('html,body').animate({scrollTop: nextLast.offset().top}, 500);
      }
    }

    if (popover) {
      _this.popover(popover, 2000, {'data-content': "Delete Success!"});
    }

    _this.updateBadge();

    return success;

  };

  SelectItems.prototype.updateBadge = function() {

    // 辅助函数：更新徽标
    // ===============

    var badgeS = this.sel['badge_selected'],
      badgeT = this.sel['badge_total'];

    if (badgeS) {
      $(badgeS).text(this.itemSelected.length);
    }

    if (badgeT) {
      $(badgeT).text(this.itemTotal);
    }

  };

  SelectItems.prototype.popover = function(selector, delay, option) {

    // 辅助函数：显示提示框
    // =================

    var $popover = $(selector);

    $popover.attr(option);
    $popover.popover('show');
    if (delay) {
      setTimeout(function () {
        $popover.popover('destroy')
      }, delay);
    }

  };

  SelectItems.prototype.bindOperation = function(selectors) {

    // 可选，绑定事件操作，通过点击按钮触发相应的操作
    // =======================================

    // var operationSelector = {
    //     select_one: '.img-item',
    //     select_reverse: '#reverse-selected',
    //     select_all: '#all-selected',
    //     select_all_cancel: '#cancel-selected',
    //     select_delete: '#del-selected',
    //     select_delete_modal: '#delete-modal',
    //     select_delete_one: '.img-opr'
    // };

    var _this = this;

    this.oprationSelector = selectors;

    // 单选
    selectors.select_one && $(selectors.select_one).click(function(e) {
      _this.selectOne($(this).find('img'), e.shiftKey);
      e.preventDefault();
    });

    // 全选
    selectors.select_all && $(selectors.select_all).click(function(e) {
      _this.allSelect();
      e.preventDefault();
    });

    // 全部取消
    selectors.select_all_cancel && $(selectors.select_all_cancel).click(function(e) {
      _this.cancelAllSelect();
      e.preventDefault();
    });

    // 反选
    selectors.select_reverse && $(selectors.select_reverse).click(function(e) {
      _this.reverseSelect();
      e.preventDefault();
    });

    // 删除选中项
    $('#delete-OK').click(function(e) {
      e.preventDefault();

      var success; 
        
      // pic
      if (_this.type == 'pic') {
        success = _this.deleteSelect(function(id) {
          var src = $('#' + _this.id_prefix + id).attr('src');
          return src.slice(7);  // strip '/local/'
        }, 'pics_path', _this.type);
      } 
      
      // album
      else if (_this.type == 'album') {
        success = _this.deleteSelect(function (id) {
          var href = $('#' + _this.id_prefix + id).closest('.cover').attr('href');
          return {type: href.slice(1, href.indexOf('/', 1)), path: href.slice(href.indexOf('/', 1) + 1)};
        }, 'albums', _this.type);

      }

      if (success) {
        $(document).trigger('deleteSelectSuccess');
      } else {
        $(document).trigger('deleteSelectFail');
      }
    });
    
    // shortcut key
    var $modal = $(selectors.select_delete_modal);
    $modal.bind('keydown', 'return', function() {
      $('#delete-OK').click();
    });
    
    selectors.select_delete && $(selectors.select_delete).click(function(e) {

      var success;
      
      // delete operation
      if (_this.type == 'pic') {

        // delete confirmation warn  
        var $modal = $(selectors.select_delete_modal);
        if ($modal.length) {
          $modal.find('.modal-body').html(_this.itemSelected.length + ' images in total');
          $modal.modal();

          return;
          
        } else {
          success = _this.deleteSelect(function(id) {
            var src = $('#' + _this.id_prefix + id).attr('src');
            return src.slice(7);  // strip '/local/'
          }, 'pics_path', _this.type);
        }
         
      } 
      
      else if (_this.type == 'album') {

        // delete confirmation warn
        var $modal = $(selectors.select_delete_modal);
        if ($modal.length) {
          var albums_path_html = '',
            folder_alert_html = '<span class="alert-danger" style="padding: 5px;margin-left: 20px;">Contains sub folders</span>';

          _this.itemSelected.forEach(function (id) {
            var href = $('#' + _this.id_prefix + id).closest('.cover').attr('href');
            var pos = href.indexOf('/', 1);
            albums_path_html += '<p><span class="delete-modal-warn">'
              + href.slice(pos + 1)
              + '</span>'
              + (href.slice(1, pos) == 'folder' ? folder_alert_html : '')
              + '</p>';
          });
          $modal.find('.modal-body').html(albums_path_html);
          $modal.modal();

          return;
                    
        } else {
          success = _this.deleteSelect(function(id) {
            var href = $('#' + _this.id_prefix + id).closest('.cover').attr('href');
            return {type: href.slice(1, href.indexOf('/', 1)), path: href.slice(href.indexOf('/', 1) + 1)};
          }, 'albums', _this.type);
        }              
      }

      if (success) {
        $(document).trigger('deleteSelectSuccess');
      } else {
        $(document).trigger('deleteSelectFail');
      }

      e.preventDefault();
    });

    // 删除单张图片
    selectors.select_delete_one && $(selectors.select_delete_one).click(function (e) {
      e.preventDefault();
      e.stopPropagation();

      var $img = $(this).prev('a.img').find('img');
      var success = _this.deleteOne({item: $img, popover: this}, function($img) {
        var src = $img.attr('src');
        return src.slice(7);  // strip '/local/'
      });

      if (success) {
        $(document).trigger('deleteOneSuccess');
      } else {
        $(document).trigger('deleteOneFail');
      }

    });

  };

  SelectItems.prototype.bindHotKeys = function() {

    // 可选，绑定键盘快捷键操作(必须先bindOperation）
    // ========================================

    var selectors = this.oprationSelector,

      hotKeys = {
        'ctrl+r':         'select_reverse',
        'ctrl+a':         'select_all',
        'ctrl+del':       'select_delete',
        'esc':            'select_all_cancel'
      };

    for (var key in hotKeys) {
      (function() {
        var selector = selectors[hotKeys[key]];
        if (selector) {
          $(document).bind('keydown', key, function(e) {
            e.preventDefault();
            $(selector).click();
          });
        }
      }());

    }

  };

  SelectItems.prototype.unBindHotKeys = function() {

    $(document).unbind('keydown');

  };

  // 不用new调用构造函数，调用时注意此函数存在于全局变量环境里
  global.selectItems = function selectItems(selector, id_prefix) {
    return new SelectItems(selector, id_prefix);
  };

  return SelectItems;

}(this));


/** ========================================================================
 * Created by song on 14-1-22.
 * =========================================================================
 * 该类用于作为一个计数牌，显示当前屏幕所对应的图片为第几张。
 * ========================================================================= */

var ItemScroll = (function () {

  function ItemScroll(options) {

    // item selector
    this.selector = options.selector;

    // badge selector
    this.badge_sel = options.badge_sel;

    // 不同元素节点间的margin
    this.margin = options.margin;

    // 元素节点的位置偏移量
    this.nodes = [];

    // 当前屏幕元素的id号
    this.currentNum = 1;

  }

  ItemScroll.prototype.refresh = function () {

    // 重新计算所有元素
    // =============

    var _this = this;

    // 记录所有节点的 top offset, bottom offset 和 id
    this.nodes = [];

    $(_this.selector).each(function () {

      var topOffset = $(this).offset().top;

      _this.nodes.push({
        top: topOffset,
        bottom: topOffset + $(this).outerHeight() + _this.margin,  // 算上了margin-bottom
        id: $(this).attr('id')
      });

    });

    // 更新currentNum和badge_sel
    this.process();

  };

  ItemScroll.prototype.process = function () {

    // 更新当前的badge
    // =============

    var windowHeight = window.innerHeight,
      baseline = $(document).scrollTop() + windowHeight / 2,  // 图片包含baseline计数牌就为当前的图片的顺序数
      nodes = this.nodes;

    function isNthNodeInCurWindow(n) {  // index from 1

      return n > 0 && n <= nodes.length
        && baseline <= nodes[n-1].bottom && baseline >= nodes[n-1].top;

    }

    if (isNthNodeInCurWindow(this.currentNum)) {
      // Do nothing
    } else if (isNthNodeInCurWindow(this.currentNum - 1)) {
      this.currentNum--;
    } else if (isNthNodeInCurWindow(this.currentNum + 1)) {
      this.currentNum++;
    } else {
      for (var i = 1; i <= nodes.length; i++) {
        if (isNthNodeInCurWindow(i)) {
          this.currentNum = i;
          break;
        }
      }
    }

    $(this.badge_sel).text(this.currentNum);

  };

  ItemScroll.prototype.scrollN = function (n) {

    // 向上/下滚动N张图片，N为正则向下，为负向上
    // ===================================

    var nodes = this.nodes,
      num = this.currentNum + +n;

    if (!n || num < 1 || num > nodes.length) {
      return;
    }

    var node = nodes[num-1],
      windowHeight = window.innerHeight,
      
      // 1/2(top + bottom) - 1/2*windowHeight
      scrTop = (node.top + node.bottom - this.margin - windowHeight) / 2;

    $('body').animate({scrollTop: scrTop}, 200);

  };

  ItemScroll.prototype.scrollToN = function (n) {

    // 滚动到第N张
    // =========

    n = parseInt(n);

    if (isNaN(n) || n < 1 || n > this.nodes.length) {
      return false;
    }

    var node = this.nodes[n-1];

    // 当滚动的距离太远时，为了效率，取消动画
    if (Math.abs(this.currentNum - n) > 10) {
      $(document).scrollTop(node.top - 50);
      return true;
    }

    $('body').animate({scrollTop: node.top - 50}, 200);

    return true;

  };

  ItemScroll.prototype.getCurrentNode = function() {

    // 辅助函数: 或许当前窗口内显示的节点对象
    // =================================

    return this.nodes[this.currentNum-1];

  };

  return ItemScroll;

}());