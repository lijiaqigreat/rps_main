var default_param={
  new_born:true,
  max_level:4,
  decay:0.7,
  node:{
    count:[0,0,0],
    children:Array(9)
  }
};
var param=default_param;
var bot= {
  init: function(_param,data)
  {
    //update param
    for(var key in _param){
      if(_param.hasOwnProperty(key)){
        param[key]=_param[key];
      }
    }
  },
  getHand:function()
  {
    if(this._private.history[0]===undefined){
      return (Math.random()*3)|0;
    }
    //update predict
    //return standard diviation
    var get_score=function(count){
      var sum1=0;
      var sum2=0;
      for(var i=0;i<3;i++){
        sum1+=count[i];
        sum2+=count[i]*count[i];
      }
      return (sum2/3-sum1*sum1/9)/(sum1/3);
    };
    node=this._private.node;
    var best_count=node.count;
    var best_score=get_score(best_count);
    var his=this._private.history;
    for(i=0;his[i]!==undefined;i++){
      var hisir=this._private.relativeHistory(his[i]);
      if(node.children[hisir]===undefined){
        node.children[hisir]=this._private.createNode(node);
        //no need to analyze deeper nodes
        break;
      }
      node=node.children[hisir];
      var score=get_score(node.count);
      if(score>best_score){
        best_score=score;
        best_count=node.count;
      }
    }
    var maxi=-1;
    var fr=function(count){
      var max=0;
      for(var i=0;i<3;i++){
        if(count[i]>max){
          max=count[i];
          maxi=i;
        }
      }
      return (maxi+1)%3;
    }(best_count);
    return (fr+this._private.h_last)%3;
  },
  update:function(h1,h0,dt)
  {
    //update prediction
    var pvt=this._private;
    this._private.predictors.forEach(function(i,e){
      var p1=e(pvt.history1);
      var p2=e(pvt.history2);
      for(var j=0;j<3;j++){
        pvt.predictions1[i*6+j*2  ]=(p1+j)%3;
        pvt.predictions1[i*6+j*2+1]=(p2+j)%3;
      }
    });
    //update scores
    this._private.selectors.forEach(function(i,e){
      var max=-Number.MAX_VALUE;
      var maxi=-1;
      var maxv=
      for(var j=0;j<this._private.predictors.length*3;j++){
        var tmp;
        tmp=pvt.scores1[i][j*2  ]=e(pvt.scores1[i][j*2  ],h1,h0,dt);
        if(max<tmp){
          maxi=j*2;
          max=tmp;
        }
        tmp=pvt.scores1[i][j*2+1]=e(pvt.scores1[i][j*2+1],h0,h1,dt);
        if(max<tmp){
          maxi=j*2+1;
          max=tmp;
        }
      }
    });


    
  },
  _private:
  {
    history1: "",
    history2: "",
    predictors: [

    ],
    selectors: [

    ],
    scores1:undefined,
    scores2:undefined,
    predictions1:undefined,
    predictions2:undefined

  }
};

self.onmessage=function(e){

  var token=e.data[0];
  var name=e.data[1];
  var args=e.data.slice(2);
  var rtn=bot[name].apply(bot,args);
  if(rtn===undefined){rtn="undefined";}
  self.postMessage({token:token,rtn:rtn});
};
