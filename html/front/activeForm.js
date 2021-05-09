layui.define(['jquery', 'form', 'xmSelect',], function (exports) {

    // https://tc39.github.io/ecma262/#sec-array.prototype.find
    if (!Array.prototype.find) {
        Object.defineProperty(Array.prototype, 'find', {
            value: function (predicate) {
                // 1. Let O be ? ToObject(this value).
                if (this == null) {
                    throw new TypeError('"this" is null or not defined');
                }

                var o = Object(this);

                // 2. Let len be ? ToLength(? Get(O, "length")).
                var len = o.length >>> 0;

                // 3. If IsCallable(predicate) is false, throw a TypeError exception.
                if (typeof predicate !== 'function') {
                    throw new TypeError('predicate must be a function');
                }

                // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
                var thisArg = arguments[1];

                // 5. Let k be 0.
                var k = 0;

                // 6. Repeat, while k < len
                while (k < len) {
                    // a. Let Pk be ! ToString(k).
                    // b. Let kValue be ? Get(O, Pk).
                    // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                    // d. If testResult is true, return kValue.
                    var kValue = o[k];
                    if (predicate.call(thisArg, kValue, k, o)) {
                        return kValue;
                    }
                    // e. Increase k by 1.
                    k++;
                }

                // 7. Return undefined.
                return undefined;
            }
        });
    }


    var $ = layui.jquery,
        form = layui.form,
        xmSelect = layui.xmSelect;

    function TableView(obj) {
        var that = this;

        obj || (obj = {});

        this.$el = typeof obj.el === 'string' ? $(obj.el) : obj.el;

        this.columns = obj.columns || [];

        this.data = obj.data ? obj.data : [];

        this.disabled = obj.disabled || false

        this.xmFnArr = []

        this.initedXmSelectInstMap = {}

        // event
        this.eventEmitter = {
            reg: {},
            addEventListener: function (key, func) {
                if (!key || !func) {
                    return false;
                }
                if (typeof func != 'function') {
                    return false;
                }
                if (!this.reg[key]) {
                    this.reg[key] = [func];
                } else {
                    this.reg[key].push(func);
                }
            },
            fire: function (key) {
                if (!key) {
                    return false;
                }
                var arg = Array.prototype.slice.call(arguments, 1);
                this.reg[key] && this.reg[key].forEach(function (item) {
                    item.apply(that, arg);
                });
            }
        }

        this.noDataHtml = '<tr><td colspan="' + this.columns.length + '" class="my-editor-table-nodata" style="text-align: center;min-height: 150px;line-height: 150px;">暂无数据</td></tr>'

        this._render()

        this._bindEvent()
    }

    TableView.prototype = {
        constructor: TableView,

        _generateUUID: function () {
            var d = new Date().getTime();
            if (window.performance && typeof window.performance.now === "function") {
                d += performance.now(); //use high-precision timer if available
            }
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return 'S' + uuid;
        },

        _render: function () {
            this._renderBaseHtml(this._renderBtn(), this.data && this.data.length ? this._renderRowByData(this.data) : this.noDataHtml)
        },

        _renderBaseHtml: function (btnHtml, rowHtml) {
            rowHtml || (rowHtml = "");
            btnHtml || (btnHtml = "");

            var htmlSTR = '<div class="active-table">' + btnHtml + '<table class="layui-table active-table__table layui-form">' +
                '<colgroup>' +
                this.columns.map(function (item) {
                    return '<col >';
                }).join('') +
                '</colgroup>' +
                '<thead>' +
                '<tr>' +
                this.columns.map(function (item) {
                    return '<th style="text-align: center;">' + item.title + '</th>'
                }).join('') +
                '</tr>' +
                '</thead>' +
                '<tbody>' +
                rowHtml +
                '</tbody>' +
                '</table>' + '</div>';

            this.$el.html(htmlSTR);

            form.render()

            this._renderXmSelect()
        },

        _renderBtn: function () {
            return '<div class="active-table__btn-container">' +
                '<div class="layui-btn layui-btn-sm add" id="addbtn">新增成员</div>' +
                '<div class="layui-btn layui-btn-danger layui-btn-sm del">删除成员</div>' +
                '</div>'
        },


        _renderRowByData: function (_data) {
            var that = this;

            return _data.map(function (rowDataItem) {

                var rowUUID = that._generateUUID();

                return '<tr data-uuid="' + rowUUID + '">' + that.columns.map(function (columnItem) {

                    var xm_uuid;

                    return '<td>' + (function (columnItem) {

                        if (columnItem.type === 'select') {
                            return '<select lay-filter="' + columnItem.field + '" ' + (that.disabled === true ? 'disabled' : '') + ' name="' + columnItem.field + '" lay-verify="required" lay-reqText="团队成员信息未填写完整">' +
                                '<option value="">请选择</option>' +
                                (rowDataItem[columnItem.field] && rowDataItem[columnItem.field].alternative ? rowDataItem[columnItem.field].alternative : (columnItem.alternative ? columnItem.alternative : [])).map(function (alter) {
                                    return '<option ' + (rowDataItem[columnItem.field] && rowDataItem[columnItem.field].currSelectedValue && rowDataItem[columnItem.field].currSelectedValue == alter.value ? 'selected' : '') + ' value="' + alter.value + '">' + alter.name + '</option>'
                                }).join('') +
                                '</select> '
                        } else if (columnItem.type === 'input') {

                            return '<input ' + (that.disabled === true ? 'disabled' : '') + ' name="' + columnItem.field + '" value="' + (rowDataItem[columnItem.field] || '') + '" type="text" placeholder="请输入' + columnItem.title + '" autocomplete="off" class="layui-input" lay-verify="required" lay-reqText="团队成员信息未填写完整">'

                        } else if (columnItem.type === 'checkbox') {

                            return '<input ' + (that.disabled === true ? 'disabled' : '') + ' type="checkbox" name="" title="" lay-skin="primary" lay-verify="required" lay-reqText="团队成员信息未填写完整">'

                        } else if (columnItem.type === 'multi-select') {
                            // 此处的uuid是绑定dom元素与xm实例，便于取值
                            xm_uuid = that._generateUUID()
                            that.xmFnArr.push(that.initXmFn.bind(that, rowDataItem[columnItem.field], columnItem, xm_uuid))
                            return '<div data-name="' + columnItem.field + '" data-uuid="' + xm_uuid + '" data-type="multi-select" style="width: 300px; margin: 20px;"></div>'
                        }

                    })(columnItem) + '</td>';

                }).join('') + '</tr>';

            }).join('');

        },

        initXmFn: function (dataItem, columnItem, uuid) {
            this.initedXmSelectInstMap[uuid] = xmSelect.render($.extend({
                el: '[data-uuid="' + uuid + '"]',
            }, dataItem && dataItem.xmSelectOption ? dataItem.xmSelectOption : {}, columnItem.xmSelectOption || {}))
        },

        _renderXmSelect: function () {
            var fn;
            while (fn = this.xmFnArr.shift()) {
                fn();
            }
        },

        _getAllCheckedTr: function () {
            return this.$el.find('tbody input[type="checkbox"]:checked').parents('tr')
        },

        _bindEvent: function () {
            var that = this;

            this.$el.find('.add').on('click', function () {

                $('.my-editor-table-nodata').remove()

                var htmlSTR = that._renderRowByData([{}])

                that.$el.find('tbody').append(htmlSTR)
				
				if($("tbody tr").length>=5){
					$('#addbtn').hide();
				}
				


                form.render()

                that._renderXmSelect()
            });
			
			
			

            this.$el.find('.del').on('click', function () {
                var trs = that._getAllCheckedTr()

                trs.each(function (index, el) {
                    $(el).remove()
                })

                if (!that.$el.find('tbody tr').length) {
                    that.$el.find('tbody').html(that.noDataHtml)
                }
				if($("tbody tr").length<5){
					$('#addbtn').show();
				}
            });

            this.columns.filter(function (columnItem) {
                return columnItem.field
            }).forEach(function (oneColumn) {
                form.on('select(' + oneColumn.field + ')', function (data) {
                    var row_uuid = $(data.elem).parents('tr').attr('data-uuid')

                    var currField = $(data.elem).attr('name')

                    var currColumn = that.columns.find(function (columnItem) {
                        return columnItem.field === currField
                    })

                    if (currColumn.type === 'select' && currColumn.onChange) {
                        currColumn.onChange(data.value, row_uuid)
                    }

                })
            })

        },

        getValue: function () {
            var that = this
            var columns = this.columns.filter(function (columnItem) {
                return columnItem.field
            })

            var data = []

            this.$el.find('tbody').find('tr').each(function (index, tr) {
                var rowData = columns.map(function (columnItem) {
                    if (columnItem.type === 'input') {
                        return $(tr).find('[name="' + columnItem.field + '"]').val()
                    } else if (columnItem.type === 'select') {
                        return {
                            name: $(tr).find('[name="' + columnItem.field + '"]').find('option:selected').text(),
                            value: $(tr).find('[name="' + columnItem.field + '"]').val(),
                        }
                    } else if (columnItem.type === 'multi-select') {
                        // 函数getValue(type), type类型 name, nameStr, value, valueStr
                        return that.initedXmSelectInstMap[$(tr).find('[data-name="' + columnItem.field + '"]').attr('data-uuid')].getValue()
                    }
                })
                // rowData

                data.push(rowData)
            })

            return data;
        }

    }

    exports('activeForm', TableView)
})

