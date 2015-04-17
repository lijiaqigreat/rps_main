//predictos will predict the next move of opponent
function LOG(e){
  self.postMessage({log:e});
}
var default_param={
  decayScores2:0.95,
  decayCount:0.95,
  holdRandom:-4,
};
function testArray(array){
  var f="";
  array.forEach(function(e,i){
    f+="("+i+":"+e+")";
  });
  return f;
}
var param=default_param;
var bot= {
  init: function(_param,data)
  {
    LOG("test!!!");
    //useful vars
    var pvt=this._private;
    var predictorn=pvt.predictors.length;
    var selectorn=pvt.selectors.length;

    var i;
    //update param
    for(var key in _param){
      if(_param.hasOwnProperty(key)){
        param[key]=_param[key];
      }
    }


    //init pvt
    pvt.predictions1=Array(predictorn*6);
    for(i=0;i<predictorn*6;i++){
      pvt.predictions1[i]=0;
    }
    pvt.predictions2=Array(selectorn);
    for(i=0;i<selectorn;i++){
      pvt.predictions2[i]=0;
    }
    pvt.scores1=Array(selectorn);
    pvt.scores2=pvt.predictions2.slice(0);
    for(i=0;i<selectorn;i++){
      pvt.scores1[i]=pvt.predictions1.slice(0);
    }

  },
  /**
   * Get selector with max score
   */
  getHand:function()
  {
    //LOG("getHand start");
    var pvt=this._private;
    return pvt.hand;
  },
  update:function(h0,h1,dt)
  {try{
    //log
    LOG("update: "+h0+" "+h1+" "+dt);
    var pvt=this._private;
    LOG("predictions1: "+testArray(pvt.predictions1));
    LOG("scores1[0]: "+testArray(pvt.scores1[0]));
    LOG("scores1[1]: "+testArray(pvt.scores1[1]));
    LOG("predictions2: "+testArray(pvt.predictions2));
    LOG("scores2: "+testArray(pvt.scores2));
    //return when start
    if(h0===3||h1===3){
      pvt.hand=0;
      return;
    }
    //update scores1, scores2
    pvt.selectors.forEach(function(e,i){
      //update scores2
      var maxv=pvt.predictions2[i];
      LOG("test s2 maxv: "+maxv);
      LOG("test s2: "+pvt.scores2[i]+" "+((maxv-h1+2)%3-1));
      pvt.scores2[i]=pvt.scores2[i]*param.decayScores2+(maxv-h1+2)%3-1;
      LOG("test s2: "+pvt.scores2[i]+" "+((maxv-h1+2)%3-1));
      var max=-Number.MAX_VALUE;
      var maxi=-1;
      maxv=-1;
      //update score1
      for(var j=0;j<pvt.predictors.length*6;j++){
        pvt.scores1[i][j]=e(pvt.scores1[i][j],pvt.predictions1[j],h0,h1,dt);
      }
    });
    //update history
    pvt.history1.push((h0&3)+(h1&3)*4+dt*16);
    pvt.history2.push((h1&3)+(h0&3)*4+dt*16);
    //update prediction1
    pvt.predictors.forEach(function(e,i){
      var p1=e(pvt.history1);
      var p2=e(pvt.history2);
      for(var j=0;j<3;j++){
        pvt.predictions1[i*6+j*2  ]=(p1+j)%3;
        pvt.predictions1[i*6+j*2+1]=(p2+j)%3;
      }
    });
    //update prediction2
    pvt.selectors.forEach(function(e,i){
      var maxv=-1;
      var maxi=-1;
      var max=-Number.MAX_VALUE;
      for(var j=0;j<pvt.predictors.length*6;j++){
        if(pvt.scores1[i][j]>max){
          max=pvt.scores1[i][j];
          maxi=j;
          maxv=pvt.predictions1[j];
        }
        pvt.predictions2[i]=maxv;
      }
    });
    var max=param.holdRandom;
    var maxi=-1;
    var maxv=(Math.random()*3)|0;
    //maxv=0;
    for(var i=0;i<pvt.predictions2.length;i++){
      if(pvt.scores2[i]>max){
        max=pvt.scores2[i];
        maxi=i;
        maxv=pvt.predictions2[i];
      }
    }
    pvt.hand=(maxv+1)%3;
    LOG("hand: "+pvt.hand);
  }catch(e){LOG("Error: "+e.stack+"");}
  },
  _private:
  {
    history1: [],
    history2: [],
    predictors: [
      function(history) //frequency
      {
        var count=[0,0,0];
        history.forEach(function(e,i){
          count[(e&12)/4]+=Math.pow(param.decayCount,history.length-i);
        });
        LOG({count:count});
        return count[0]>count[1]?(count[0]>count[2]?0:2):(count[1]>count[2]?1:2);//maxi of count
      },
      //most recent history match
      function(history)
      {
        LOG("history: "+testArray(history));
        var start1=Array(history.length-1);
        for(var i=0;i<history.length-1;i++){
          start1[i]=i;
        }
        var length=0;
        while(true){
          LOG("start1: "+testArray(start1));
          var start2=[];
          length++;
          for(i=0;i<start1.length;i++){
            if((history[start1[i]-length]&60)===(history[history.length-length]&60)){
              start2.push(i);
            }
          }
          if(start2.length===0){
            break;
          }
          start1=start2;
        }
        return length===1?0:history[start1[start1.length-1]];
      }
    ],
    selectors: [
      function(score,p1,h0,h1,dt){
        return score*0.95+((p1-h1+2)%3)-1;
      },
      function(score,p1,h0,h1,dt){
        return (p1-h1+2)%3===0?0:(score*0.95+(p1-h1+2)%3-0.8);
      }
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
