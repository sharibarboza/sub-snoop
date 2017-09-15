'use strict';

/**
 * @ngdoc factory
 * @name SubSnoopApp.factory
 * @description
 * # subFactory
 * Factory in the SubSnoopApp.
 */
 angular.module('SubSnoopApp')
 .factory('subFactory', ['$http', 'userFactory', '$q', 'moment', '$sce', '$filter', 'rank', function ($http, userFactory, $q, moment, $sce, $filter, rank) {
    var baseUrl = 'https://www.reddit.com/user/';
    var rawJson = 'raw_json=1';
    var pages = 10;
    var username;
    var promise;
    var after = "0";
    var subLength = 0;
    var defaultSortedArray = [];
    var upvotes = 0;

    var comments = [];
    var submissions = [];
    var subs = {};
    var commentData = [];
    var submitData = [];
    var subData = {};
    var latest = [];

    /*
     Callback function to fetch data from user's comments
    */
    window.commentsCallback = function(response) {
      commentData.push(response.data.children);
      after = response.data.after;
      pushData(response.data, 'comments');
    };

    /*
     Callback function to fetch data from user's submissions
    */
    window.submitsCallback = function(response) {
      submitData.push(response.data.children);
      after = response.data.after;
      pushData(response.data, 'submits');
    };

    /*
     User interface for sub factory
    */
    var factory = {
      getData: function(user) {
        resetData();
        username = user;
        var userPromise = userFactory.getData(user);
        return getSubPromise(userPromise);
      },
      getSubData: function() {
        return subData;
      },
      checkUser: function(user) {
        if (!username) {
          return false;
        } else {
          return matchUser(user, username);
        }
      },
      getDefaultSortedArray: function() {
        return defaultSortedArray;
      },
      getSubLength: function() {
        return subLength;
      },
      getCommentsList: function() {
        return comments;
      },
      getSubmitsList: function() {
        return submissions;
      },
      getLatest: function() {
        return latest;
      },
      compareDates: compareDates,
      getFirstPost: getFirstPost,
      getNewestSub: getNewestSub,
      getLatestPost: getLatestPost,
      getRecentPosts: getRecentPosts
    };
    return factory;

    /*
     Check to see if two username strings match
    */
    function matchUser(user1, user2) {
      return user2.toLowerCase().indexOf(user1.toLowerCase()) >= 0;
    }

    /*
     Configure sub data object, which will be passed to the controllers.
    */
    function setSubData(response) {
      organizeComments(comments);
      organizeSubmitted(submissions);
      setTotalUps();
      setDefaultSortedArray();
      sortRecent();

      subData = {
        'user': response,
        'comments' : comments.length,
        'submissions' : submissions.length,
        'subs' : subs,
        'latest' : [getLatest('comment'), getLatest('submissions')],
        'upvotes' : upvotes
      }
    };

    /*
     Reset all data to empty lists (used for getting a new user)
    */
    function resetData() {
      after = "0";
      comments = [];
      submissions = [];
      subs = {};
      commentData = [];
      submitData = [];
      subData = {};
      upvotes = 0;
      latest = [];
    };

    /*
     Only if user promise resolves, then do promise chaining for comments and
     submissions asynchronously
    */
    function getSubPromise(userPromise) {
      var subPromise = userPromise.then(function(response) {
        if (response && matchUser(response.name, username)) {
          var commentPromise = promiseChain('comments', 'commentsCallback');
          var submitPromise = promiseChain('submitted', 'submitsCallback');

          // Resolve both comment and submission promises together
          var dataPromise = $q.all([commentPromise, submitPromise]).then(function() {
            setSubData(response);
            return subData;
          });
          return dataPromise;
        } else {
          return null;
        }
      });
      return subPromise;
    };

    /*
     Make the http request to the Reddit API using JSONP.
    */
    function getJSONP(where, callback) {
      var url = 'https://www.reddit.com/user/'+username+'/'+where+'.json?limit=100&after='+after+'&jsonp='+callback;
      var trustedUrl =  $sce.trustAsResourceUrl(url);
      return $http.jsonp(trustedUrl);
    };

    /*
     Push the comment/submission data to their respective lists
    */
    function pushData(response, where) {
      if (response) {
        var data = response.children;
        for (var i = 0; i < data.length; i++) {
          var item = data[i].data;
          if (where === 'comments') {
            item.type = 'comment';
            comments.push(item);
          } else {
            item.type = 'submit';
            submissions.push(item);
          }
        }
      }
    };

    function getDataList(where) {
      return where === 'comments' ? commentData : submitData;
    };

    /*
     Resolve promise and return data if there is no more requests.
     If there is still an after value, chain the next promise.
    */
    function getPromise(where, callback, promise, index) {
      var promise = promise.then(function() {
        return getDataList(where);
      }, function() {
        if (index === pages-1) {
          return getDataList(where);
        } else {
          return after ? getJSONP(where, callback) : getDataList(where);
        }
      });
      return promise;
    };

    /*
     Chain data promises for fetching comments or submissions.
     Reddit API caps at 1000 comments and submisions each. Only 100 items can be
     fetched at a time, making for at most 10 API requests.
    */
    function promiseChain(where, callback) {
      var promise = getJSONP(where, callback);
      for (var i = 0; i < pages; i++) {
        promise = getPromise(where, callback, promise, i);
      }
      return promise;
    };

    /*
     Grabs the comments and store them in their respective sub object
     as well as other statistics
    */
    function organizeComments(comments) {
      subs = {};
      // Push comments
      for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        var subreddit = comment.subreddit;
        var ups = parseInt(comment.ups);
        
        if (subreddit in subs) {
          var comment_list = subs[subreddit].comments;
          var date = moment(comment.created_utc*1000);

          subs[subreddit].comment_ups += ups;

          comment_list.push(comment);
          if (date > subs[subreddit].recent_comment) {
            subs[subreddit].recent_comment = date;
          }
        } else {
          subs[subreddit] = {};
          subs[subreddit].comments = new Array(comment);
          subs[subreddit].recent_comment = moment(comment.created_utc*1000);
          subs[subreddit].comment_ups = ups;
          subs[subreddit].submissions = [];
          subs[subreddit].submission_ups = 0;
          subs[subreddit].gilded_comments = 0;
          subs[subreddit].gilded_submissions = 0;
          subs[subreddit].count = 0;
        }

        if (comment.gilded > 0) {
          subs[subreddit].gilded_comments += 1;
        }

        subs[subreddit].count += 1;
        subs[subreddit].recent_activity = subs[subreddit].recent_comment;
      }
    };

    /*
     Grabs submissions and stores them in their respective sub object
    */
    function organizeSubmitted(submissions) {
      for (var i = 0; i < submissions.length; i++) {
        var submission = submissions[i];
        var subreddit = submission.subreddit;
        var ups = parseInt(submission.ups);

        if (subreddit in subs && subs[subreddit].submissions.length > 0) {
          var submission_list = subs[subreddit].submissions;
          var date = moment(submission.created_utc*1000);
          var recent_submission = subs[subreddit].recent_submission;

          subs[subreddit].submission_ups += ups;

          submission_list.push(submission);
          if (date > recent_submission) {
            subs[subreddit].recent_submission = date;
          }
        } else {
          if (!(subreddit in subs)) {
            subs[subreddit] = {};
            subs[subreddit].submissions = [];
            subs[subreddit].comments = [];
            subs[subreddit].comment_ups = 0;
            subs[subreddit].gilded_comments = 0;
            subs[subreddit].gilded_submissions = 0;
            subs[subreddit].count = 0;
          } 
          subs[subreddit].submissions.push(submission);
          subs[subreddit].recent_submission = moment(submission.created_utc*1000);
          subs[subreddit].submission_ups = ups;
        }

        if (submission.gilded > 0) {
          subs[subreddit].gilded_submissions += 1;
        }

        if ('recent_comment' in subs[subreddit]) {
          if (subs[subreddit].recent_submission > subs[subreddit].recent_comment) {
            subs[subreddit].recent_activity = subs[subreddit].recent_submission;
          }
        } else {
          subs[subreddit].recent_activity = subs[subreddit].recent_submission;
        }

        subs[subreddit].count += 1;
      }
    };

    /*
     Get the combined total of comment and submission upvotes
    */
    function setTotalUps() {
      for (var sub in subs) {
        subs[sub].total_ups = subs[sub].comment_ups + subs[sub].submission_ups;
        upvotes += subs[sub].total_ups;
      }
    };

    /*
     Compute the default sorted subreddits alphabetically
     Also, get the length
    */
    function setDefaultSortedArray() {
      defaultSortedArray = $filter('sortSubs')(Object.keys(subs), 'subName', subs);
      subLength = defaultSortedArray.length;
    };

    /*
     Get the most recent comment or submission 
    */
    function getLatest(where) {
      if (where === 'comment') {
        return comments[0];
      } else {
        return submissions[0];
      }
    }

    /*
     Get the oldest post.
     If sub is null, then get the oldest post out of all the user's subs,
     otherwise, get the oldest post in the sub only.
    */
    function getFirstPost(sub) {
      if (sub) {
        var subComment, subSubmit;
        if ('comments' in sub) {
          subComment = sub.comments[sub.comments.length-1];
        } 

        if ('submissions' in sub) {
          subSubmit = sub.submissions[sub.submissions.length-1];
        }

        return compareDates(subComment, subSubmit, false);
      } else {
        return latest[latest.length-1];
      }
    }

    /*
     Get the newest post.
     If sub is null, then get the newest post out of all the user's subs,
     otherwise, get the newest post in the sub only.
    */
    function getLatestPost(sub) {
      if (sub) {
        var subComment, subSubmit;
        if ('comments' in sub) {
          subComment = sub.comments[0];
        } 

        if ('submissions' in sub) {
          subSubmit = sub.submissions[0];
        }

        return compareDates(subComment, subSubmit, true);
      } else {
        return latest[0];
      }
    }

    /*
     Get the newest active sub by taking the oldest post from each subreddit,
     sort the posts by date and get the newest date. Whichever sub this post 
     belongs to is the new sub.
    */
    function getNewestSub() {
      var firstPosts = [];
      var subComments, subSubmits, oldestComment, oldestSubmit;

      for (var key in subs) {
        subComments = subs[key].comments;
        subSubmits = subs[key].submissions;

        oldestComment = subs[key].comments[subComments.length-1];
        oldestSubmit = subs[key].submissions[subSubmits.length-1];

        firstPosts.push(compareDates(oldestComment, oldestSubmit, false));
      }

      return rank.getTopPost(firstPosts, 'newest').subreddit;
    }

    /*
     Order all of a user's posts by date with the most recent being at the
     front of the array.
    */
    function sortRecent() {
      var comment_index = 0;
      var submit_index = 0;
      var comment, submit, comment_date, submit_date;

      while (comment_index <= comments.length && submit_index <= submissions.length) {
        if (comments.length > comment_index) {
          comment = comments[comment_index];
          comment_date = moment(comment.created_utc*1000);
        } else {
          comment = null;
        }

        if (submissions.length > submit_index) {
          submit = submissions[submit_index];
          submit_date = moment(submit.created_utc*1000);
        } else {
          submit = null;
        }

        /* 
          When a comment or submission is pushed, increase the index, otherwise keep
          the index where it is to compare with the next item.
        */
        if (comment && submit) {
          if (comment_date > submit_date) {
            latest.push(comment);
            comment_index += 1;
          } else {
            latest.push(submit);
            submit_index += 1;
          }
        } else if (comment && !submit) {
          latest.push(comment);
          comment_index += 1;
        } else if (!comment && submit) {
          latest.push(submit);
          submit_index += 1;
        } else {
          // Not enough comments and submissions
          break;
        }
      }
    };

    /*
     Compare to two dates and return one based on the newest date
     or oldest date.
    */
    function compareDates(post1, post2, newest) {
      var post, date1, date2;

      if (post1) {
        date1 = post1.created_utc * 1000;
      }
      if (post2) {
        date2 = post2.created_utc * 1000;
      }

      if (date1 && date2) {
        if (newest) {
          post = (date1 > date2) ? post1 : post2;
        } else {
          post = (date1 < date2) ? post1 : post2;
        }
      } else if (date1) {
        post = post1;
      } else {
        post = post2;
      }

      // Return the post with either the oldest/newest comment
      return post;
    }

    /*
     Get either the most recent comments or submissions out of all use's subs.
     A limit can be set to return a specific number of posts.
    */
    function getRecentPosts(where, limit) {
      var posts = [];
      var i = 0;

      while (posts.length < limit && i < latest.length) {
        var item = latest[i];
        if (where === 'comments' && item.type === 'comment') {
          posts.push(item);
        } else if (where === 'submissions' && item.type === 'submit') {
          posts.push(item);
        }

        i += 1;
      }
      return posts;
    };

  }]);