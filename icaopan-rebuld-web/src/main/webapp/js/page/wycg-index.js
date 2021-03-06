var MA = myAccount = {};

function jsoncallback(e){
	for(var i=0; i<3;i++){
		var _node=$('.index-list li:eq('+i+')');
		if(e.info.result[i]){
			if(e.info.result[i].dailyChangePercent>0){
				_node.removeClass('text-green').addClass('text-red');
			}else if(e.info.result[i].dailyChangePercent<0){
				_node.removeClass('text-red').addClass('text-green');
			}
			_node.find('.big-num').html((e.info.result[i].lastPrice).toFixed(3));
			_node.find('.value').html(e.info.result[i].dailyChange.toFixed(2));
			_node.find('.rate').html((e.info.result[i].dailyChangePercent*100).toFixed(2)+'%');
		}
	}
}

MA.queryIndexInfo = function(){
	$.ajax({
		url: "//md.icaopan.com/openapi/queryUserCustomizeMarketDataList",  
		type:'post',
		dataType:'jsonp',
		data:{'stockCodes':'000001.SH,399001.SZ,399006.SZ', 'is_web':'1'}
	});
};

MA.queryStockAccount = function () {
	$.ajax({
		url: systemConfig.path + "/user/ViewMyAccountCenterIndex.ajax",
		success: function(r) {
			if(r.totalAmount <= r.warnLine){
				$("#alertLineDd").addClass('text-red');
			}
			if(r.totalAmount <= r.openLine){
				$("#wrongLineDd").addClass('text-red');
			}
			$("#sumAmountDd").html(DM.utils.farmatMoney(r.totalAmount,2));
			$("#stockBalanceDd").html(DM.utils.farmatMoney(r.cashAvailableAmount, 2));
            $("#stockBalanceDJ").html(DM.utils.farmatMoney(r.cashFrozenAmount, 2));
			$("#alertLineDd").html(DM.utils.farmatMoney(r.warnLine, 2));
			$("#marketValueDd").html(DM.utils.farmatMoney(r.marketValue, 2));
			if(r.profitValue>0){
				$("#profitValue").removeClass('text-green').addClass('text-red');
			}else if(r.profitValue<0){
				$("#profitValue").removeClass('text-red').addClass('text-green');
			}
			$("#profitValue").html(DM.utils.farmatMoney(r.profitValue, 2));
			$("#wrongLineDd").html(DM.utils.farmatMoney(r.openLine, 2));
			//$("#pureAmount").html(DM.utils.farmatMoney(r.pureAmount, 2));
		}
	});
};

MA.queryHoldStock = function(){
	var html = '<tr><th width="116">股票简称</th><th width="115">股票市值</th><th width="128">浮动盈亏/比例</th><th width="120">持股/可用</th><th width="104">现价</th><th width="98">成本价</th><th></th></tr>';
	$.ajax({
		url:systemConfig.path + "/trade/queryHoldStockListByPage.ajax",
		data:{"page":1, "pageSize":8 },
		type:'post',
		success:function(r) {
			var list = r.dataList;
			var sumProfitValue=0;
			if (list != null && list.length > 0) {
				var isOdd=true;
				for (var i = 0; i < list.length; i++) {
					var obj = list[i];
					var securityName = obj.securityName;
					var securityCode = obj.securityCode;
					var marketValue = obj.marketValue;
					marketValue=DM.utils.toFixedNumber(marketValue);
					var marketProfit = obj.marketProfit;
					marketProfit=DM.utils.toFixedNumber(marketProfit, 3);
					var marketProfitPercent = obj.marketProfitPercent;
					marketProfitPercent=DF.formateDecimalToPercent(marketProfitPercent);
					var positionAmount = obj.amount;
//					if(positionAmount==0){
//						continue;
//					}
					sumProfitValue=sumProfitValue+marketProfit;
					var t0PlacementQuantity = obj.availableAmount;
					var latestPrice = obj.latestPrice;
					latestPrice=DM.utils.toFixedNumber(latestPrice);
					var costPrice = obj.costPrice;
					costPrice=DM.utils.toFixedNumber(costPrice, 3);
					html += "<tr";
					if (isOdd) {
						html += " class='odd'>";
					} else {
						html += ">";
					}
					var redOrGreen="";
					if(marketProfit<0){
						redOrGreen="green";
					}else if(marketProfit>0){
						redOrGreen="red";
					}
					html += "<td><p>" +securityName + "</p><p>" + securityCode + "</p></td>";
					html += "<td>" + marketValue + "</td><td class='text-"+redOrGreen+"'><p>" + marketProfit + "</p>" + marketProfitPercent + "</td>";
					html += "<td><p>" + positionAmount + "</p><p>" + t0PlacementQuantity + "</p></td>";
					html += "<td>" + latestPrice + "</td>";
					html += "<td>" + costPrice + "</td><td>";
					html+='<a class="btn4 btn4-red" href='+systemConfig.path+"/trade/BuyStocksInit.do?stockCode="+securityCode+'>买入</a>';
					html+='<a class="btn4 btn4-blue mar-t5" href='+systemConfig.path+"/trade/SellStocksInit.do?stockCode="+securityCode+'>卖出</a></td></tr>';
					isOdd = !isOdd;
				}
			} else {
				html += "<tr><td colspan='7' class='txt-c'>暂无记录</td></tr>";
			}
			$("#holdStockTable").html(html);
		}
	});
};

$(function(){
	//导航焦点态 + 子导航焦点态
	$('#main-nav li:eq(1)').addClass('current');
	$('.aside-nav li:eq(0)').addClass('active');
	
	//获取三个指数数据接口 + 获取数据信息
	MA.queryIndexInfo();
	MA.queryStockAccount();
	MA.queryHoldStock();
	
	function pageGetContent(){
		
		$.ajax({
			url:systemConfig.path + "/user/isRefreshMarketData.ajax",
			success:function(r){
				if(r.isRefresh){
					MA.queryIndexInfo();
					MA.queryStockAccount();
					MA.queryHoldStock();
				}
			}
		});
	}
	
	//定时刷新数据
	setInterval(function () {
		configTimer.proxy(pageGetContent)
	},5000);
	
	// 问题悬浮
	$(".question").hover(function() {
		var $el = $(this),
			txt = $el.attr("tips");
			html = '<div class="pop-gray-tip"><em class="e1">&#9660;</em><em class="e2">&#9660;</em>' + txt + '</div>';
		$(html).appendTo("body");
		var h = $(".pop-gray-tip").height();
		$(".pop-gray-tip").css({ "left": ($el.offset().left + $el.width() - 115) + "px", "top": (($el.offset().top)-h-33) + "px" });
	}, function() {
		$(".pop-gray-tip").remove();
	});
});