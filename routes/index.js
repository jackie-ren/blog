var express = require('express');
var router = express.Router();
var crypto=require('crypto')
var mysql=require('./../database');
var moment=require('moment');

/* GET home page. */
router.get('/', function(req, res, next) {
	var page=req.query.page||1;
	var start=(page-1)*8;
	var end=page*8;
	var queryCount='select count(*) as articleNum from article';
	var queryArticle='select * from article order by articleID desc limit '+start+','+end;
	mysql.query(queryArticle,function(err,rows,fields){
		var articles=rows;
		articles.forEach(function(ele){
			ele.articleTime=moment(ele.articleTime).format("YYYY-MM-DD")
		});
		mysql.query(queryCount,function(err,rows,fields){
			var articleNum=rows[0].articleNum;
			var pageNum=Math.ceil(articleNum/8)
			res.render("index",{articles:articles,user:req.session.user,pageNum:pageNum,page:page});
		});
	});
	// var query = 'select * from article order by articleID desc';
	// mysql.query(query,function(err,rows,fields){
	// 	var articles=rows;
	// 	articles.forEach(function(ele){
	// 		console.log(moment(ele.articleTime).format("YYYY-MM-DD"));
	// 		ele.articleTime=moment(ele.articleTime).format("YYYY-MM-DD")
	// 	});
 //  		res.render('index', {user:req.session.user, articles: articles });
	// });
});

router.get('/login',function(req,res,next){
	console.log("==========login");
	res.render('login',{message:''});
});
router.get('/login1',function(req,res,next){
	console.log("-------------login1");
	res.render('login1',{message:''});
});
router.post("/login",function(req,res,next){
	var name=req.body.name;
	var password=req.body.password;
	var hash=crypto.createHash('md5');
	hash.update(password)
	password=hash.digest('hex');
	var query='select * from author where authorName='+mysql.escape(name)+'and authorPassword='+mysql.escape(password);
	mysql.query(query,function(err,rows,fields){
		if(err){
			console.log(err);
			return;
		}
		var user=rows[0];

		if(!user){
			res.render('login',{message:'用户名或者密码错误'});
			return;
		}
		req.session.userSign=true;
		req.session.userID=user.authorID;
		req.session.user=user;
		res.redirect("/");			
	});
});
router.get('/articles/:articleID',function(req,res,next){
	var articleID=req.params.articleID;
	var query='select * from article where articleID='+mysql.escape(articleID);
	mysql.query(query,function(err,rows,fields){
		if(err){
			console.log(err);
			return;
		}
		var query='update article set articleClick=articleClick+1 where articleID='+mysql.escape(articleID);
		mysql.query(query,function(err,rows,fields){
			if (err) {
				console.log(err)
				return;
			}
		});
		var article=rows[0];
		var year=article.articleTime.getFullYear();
		var month=article.articleTime.getMonth()+1>10?article.articleTime.getMonth():'0'+(article.articleTime.getMonth()+1);
		var date=article.articleTime.getDate()>9?article.articleTime.getDate():'0'+article.articleTime.getDate();
		article.articleTime=year+'-'+month+'-'+date;
		res.render('article',{article:article});
	})
});
router.get('/edit',function(req,res,next){
	console.log("user:",req.session);
	var user=req.session.user;
	if (!user) {
		res.redirect('/login');
		return;
	}
	res.render('edit',{user:user});
});
router.post('/edit',function(req,res,next){
	var title=req.body.title;
	var content=req.body.content;
	var author=req.session.user.authorName;
	var query = 'insert article set articleTitle='+mysql.escape(title)+
	',articleAuthor='+mysql.escape(author)+',articleContent='+mysql.escape(content)+',articleTime=curdate()';
	mysql.query(query,function(err,rows,fields){
		if(err){
			console.log(err);
			return;
		}
		res.redirect('/');
	});

});
router.get('/modify/:articleID',function(req,res,next){
	var articleID=req.params.articleID;
	var user=req.session.user;
	var query = 'select * from article where articleID='+mysql.escape(articleID);
	if(!user){
		res.redirect('/login');
		return;
	}
	mysql.query(query,function(err,rows,fields){
		if (err) {
			console.log(err)
			return;
		}
		var article=rows[0];
		var title=article.articleTitle;
		var content=article.articleContent;
		console.log(title,content)
		res.render('modify',{user:user,articleID:articleID,title:title,content:content});
	})
});
router.post('/modify/:articleID',function(req,res,next){
	var articleID=req.params.articleID;
	var user=req.session.user;
	var title=req.body.title;
	var content=req.body.content;
	var query = 'update article set articleTitle='+mysql.escape(title)+',articleContent='+mysql.escape(content)+'where articleID='+mysql.escape(articleID);
	if(!user){
		res.redirect('/login');
		return;
	}
	mysql.query(query,function(err,rows,fields){
		if (err) {
			console.log(err)
			return;
		}
		res.redirect('/');
	})
});
router.get("/delete/:articleID",function(req,res,next){
	var articleID=req.params.articleID;
	var suer=req.session.user;
	var query='delete from article where articleID='+mysql.escape(articleID)
	if(!user){
		res.redirect("/logout")
		return;
	}
	mysql.query(query,function(err,rows,fields){
		if (err) {
			console.log(err);
			return;
		}
		res.redirect('/',{user:user});

	})
})
router.get('/friends',function(req,res,next){
	res.render('friends')
});
router.get('/about',function(req,res,next){
	res.render('about',{user:req.session.user});
});
router.get('/logout',function(req,res,next){
	req.session.user=null;
	res.redirect("/",{user:user});
});
module.exports = router;
