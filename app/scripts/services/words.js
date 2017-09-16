'use strict';

/**
 * @ngdoc service
 * @name SubSnoopApp.words
 * @description
 * # words
 * Factory in the SubSnoopApp.
 */
angular.module('SubSnoopApp')
  .factory('words', function () {
    var wordDict = {};
    var wordArray = [];

    var stopWords = [
      "a",
      "about",
      "above",
      "after",
      "again",
      "against",
      "all",
      "am",
      "an",
      "and",
      "any",
      "are",
      "aren't",
      "as",
      "at",
      "be",
      "because",
      "been",
      "before",
      "being",
      "below",
      "between",
      "both",
      "but",
      "by",
      "can",
      "can't",
      "cannot",
      "could",
      "couldn't",
      "did",
      "didn't",
      "do",
      "does",
      "doesn't",
      "doing",
      "don't",
      "down",
      "during",
      "each",
      "few",
      "for",
      "from",
      "further",
      "get",
      "had",
      "hadn't",
      "has",
      "hasn't",
      "have",
      "haven't",
      "having",
      "he",
      "he'd",
      "he'll",
      "he's",
      "her",
      "here",
      "here's",
      "hers",
      "herself",
      "him",
      "himself",
      "his",
      "how",
      "how's",
      "i",
      "i'd",
      "i'll",
      "i'm",
      "i've",
      "if",
      "in",
      "into",
      "is",
      "isn't",
      "it",
      "it's",
      "its",
      "itself",
      "let's",
      "me",
      "more",
      "most",
      "mustn't",
      "my",
      "myself",
      "no",
      "nor",
      "not",
      "of",
      "off",
      "on",
      "once",
      "only",
      "or",
      "other",
      "ought",
      "our",
      "ours",
      "ourselves",
      "out",
      "over",
      "own",
      "same",
      "shan't",
      "she",
      "she'd",
      "she'll",
      "she's",
      "should",
      "shouldn't",
      "so",
      "some",
      "such",
      "than",
      "that",
      "that's",
      "the",
      "their",
      "theirs",
      "them",
      "themselves",
      "then",
      "there",
      "there's",
      "these",
      "they",
      "they'd",
      "they'll",
      "they're",
      "they've",
      "this",
      "those",
      "through",
      "to",
      "too",
      "under",
      "until",
      "up",
      "very",
      "was",
      "wasn't",
      "we",
      "we'd",
      "we'll",
      "we're",
      "we've",
      "were",
      "weren't",
      "what",
      "what's",
      "when",
      "when's",
      "where",
      "where's",
      "which",
      "while",
      "who",
      "who's",
      "whom",
      "why",
      "why's",
      "with",
      "won't",
      "would",
      "wouldn't",
      "you",
      "you'd",
      "you'll",
      "you're",
      "you've",
      "your",
      "yours",
      "yourself",
      "yourselves"
    ];

    /*
     Split comments or submissions for a specific subreddit into words for word cloud
    */
    return {
      getWords: function(subs, sub) {
        resetData();

        var comments = subs[sub].comments;
        var submissions = subs[sub].submissions;

        splitWords(comments, 'comments');
        splitWords(submissions, 'submits');

        for (var key in wordDict) {
          var wordObj = {};
          wordObj.text = key;
          wordObj.weight = wordDict[key];
          wordArray.push(wordObj);
        }

        return wordArray;
      }
    };

    /*
     Reset array and dictionaries for new subreddit
    */
    function resetData() {
      wordDict = {};
      wordArray = [];     
    }

    /*
     Iterate through comments or submissions and split each body text
     into separate words
    */
    function splitWords(data, where) {
      for (var i = 0; i < data.length; i++) {
        var post = data[i], body_words, title_words;

        if (where === 'comments') {
          groupWords(post.body);
        } else if (where === 'submits') {
          groupWords(post.title);

          if ('selftext' in post) {
            groupWords(post.selftext);
          } 
        }
      }
    }

    /*
     Split body text into array of words and clean words of non-alpha characters
    */
    function groupWords(body) {
      var words = body.split(' ');

      for (var i = 0; i < words.length; i++) {
        var word = words[i];
        
        if (isNotLink(word)) {
          var splitWords = cleanWord(word);       
          addWords(splitWords);
        }
      }
    }

    /*
     Checks whether a word is not a link
    */
    function isNotLink(word) {
      return word.indexOf('http') < 0;
    }

    /*
     Keep a count of each word and store in wordDict
    */
    function addWords(words) {
      for (var i = 0; i < words.length; i++) {
        var word = words[i].toLowerCase();

        if (filterWord(word)) {
          if (word in wordDict) {
            wordDict[word] += 1;
          } else {
            wordDict[word] = 1;
          }
        }
      }
    }

    /*
     Filter words to be included in the word cloud
     - Words that are too long or short are exluded
     - Words that are classified as a stopword are excluded
     - Words that are anchor links are excluded
    */
    function filterWord(word) {
      if (stopWords.indexOf(word) >= 0) {
        return false;
      } else if (word.length > 20 || word.length < 3) {
        return false;
      }
      return true;
    }

    /*
     Remove non-alpha characters from word
    */
    function cleanWord(word) {
      var newWords = [];
      var current = '';

      for (var i = 0; i < word.length; i++) {
        var char = word[i];
        if (char.match(/[a-z']/i)) {
          current += char;
        } else {
          if (current.length > 0) {
            newWords.push(current);
          }
          current = '';
        }
      }
      if (newWords.indexOf(current) < 0 && current.length > 0) {
        newWords.push(current);
      }

      return newWords;
    }

  });