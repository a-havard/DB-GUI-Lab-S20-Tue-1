const pool = require('./db');
const crypto = require('crypto');
const salt = "nHBvb9INojnioygtcuVRETRYUIY890-nmvds";

module.exports = function routes(app, logger) {
  // GET /
  app.get('/', (req, res) => {
    res.status(200).send('Go to 0.0.0.0:3000.');
  });

  app.get('/accountId', (req, res) => {
    pool.getConnection((err, connection) => {
      if (err) {
        logger.error("Could not connecto to the database!", err);
        return res.status(400).json({ 
          "data": -1,
          "message": "Could not connect to the database!"
        });
      }

      let validInformation = requireQueryParams(req, ["username"]);
      if (!validInformation) {
        connection.release();
        logger.error("Could not connect to the database!", err);
        return res.status(200).json({
          "data": -1,
          "message": "Need to pass username to API through request body!"
        });
      }

      let username = req.query.username;
      let sql = `SELECT userId FROM Accounts WHERE username = "${username}"`;
      connection.query(sql, (err, rows, fields) => {
        if (err) {
          connection.release();
          logger.error("Could not connect to the database!", err);
          return res.status(200).json({
            "data": -1,
            "message": "Need to pass username to API through request body!"
          });
        }

        connection.release();
        if (rows.length === 0) {
          return res.status(200).json({
            "data": -1,
            "message": "No user exists with that username!"
          });
        }

        return res.status(200).json({
          "data": rows[0].userId,
          "message": "Found a userId for that username!"
        })
      })
    });
  });

  app.post('/accounts', async (req, res) => {
    pool.getConnection((err, connection) => {
      // Try to connect to database, return an error if cannot
      if (err) {
        logger.error("Could not connect to the database!", err);
        return res.status(400).json({
          "data": -1,
          "message": "Could not connect to the database!"
        });
      }

      // Require a first name, last name, username, and password in the req.body
      let validInformation = requireBodyParams(req, ["firstName", "lastName", "username", "password"]);
      if (!validInformation) {
        connection.release();
        return res.status(200).json({
          "data": -1,
          "message": "Not a valid request! Check API Schema!"
        });
      }

      // Get all the parameters in the body (in case later GUI allows you to write a bio, etc.
      logger.info(`Received create account request for account: ${req.body.username}`);

      // Make sure that account is available
      connection.query(`SELECT * FROM Accounts WHERE username = "${req.body.username}"`, (err, rows, fields) => {
        if (err) {
          logger.error("Could not connect to the database!", err);
          connection.release();
          return res.status(400).json({
            "data": -1,
            "message": "Could not connect to the database!"
          });
        }

        // Check if that account is taken
        let accountTaken = rows.length > 0;
        if (accountTaken) {
          logger.info(`That account is already taken!`);
          connection.release();
          return res.status(400).json({
            "data": -1,
            "message": "That account is already taken!"
          });
        }

        logger.info(`That account is available!`);

        // Hash password, with both password and username so that matching passwords don't have matching hashes
        const hash = crypto.createHash("sha256");
        hash.update(req.body.password + req.body.username + salt);
        req.body.password = hash.digest("hex");
        let {parameters, values} = getReqParamsFromBody(req);

        // Add account to database
        let sql = `INSERT INTO Accounts(${parameters.join(", ")})
                      VALUES(${values.join(", ")});`;

        connection.query(sql, (err, rows, fields) => {
          if (err) {
            logger.error("Could not create an account!", err);
            connection.release();
            return res.status(400).json({
              "data": -1,
              "message": "Failed to create an account!"
            });
          }

          logger.info(`Successfully created an account!`);

          connection.release();
          return res.status(200).json({
            "data": rows.insertId,
            "message": "Successfully created an account!"
          });
        });
      });
    });
  });

  app.post('/accounts/login', async (req, res) => {
    pool.getConnection((err, connection) => {
      // Try to connect to database, return an error if cannot
      if (err) {
        logger.error("Could not connect to the database!", err);
        return res.status(400).json({
          "data": -1,
          "message": "Could not connect to the database!"
        });
      }

      // Require a first name, last name, username, and password in the req.body
      let validInformation = requireBodyParams(req, ["username", "password"]);
      if (!validInformation) {
        connection.release();
        return res.status(200).json({
          "data": -1,
          "message": "Not a valid request! Check API Schema!"
        });
      }

      // Hash password, with both password and username so that matching passwords don't have matching hashes
      const hash = crypto.createHash("sha256");
      hash.update(req.body.password + req.body.username + salt);
      req.body.password = hash.digest("hex");

      connection.query(`SELECT userId FROM Accounts WHERE username = "${req.body.username}" AND password = "${req.body.password}"`, (err, rows, fields) => {
        connection.release();
        if (err) {
          logger.error("Could not connect to the database!", err);
          return res.status(400).json({
            "data": -1,
            "message": "Could not connect to the database!"
          });
        }
        let matched = rows.length > 0;
        if (matched) {
          logger.info(`Successful login for ${req.body.username}!`);
          return res.status(200).json({
            "data": rows[0].userId,
            "message": "Login successful!"
          });
        } else {
          logger.info(`Unsuccessful login for ${req.body.username}!`);
          return res.status(400).json({
            "data": -1,
            "message": "Login failed!"
          });
        }
      });
    });
  });


  app.put('/accounts/:accountId/bio', async (req, res) => {
    pool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        return couldNotConnect(res);
      }

      let accountId = typeof req.params.accountId === "string" ? parseInt(req.params.accountId) : req.params.accountId;
      let validInformation = requireBodyParams(req, ["bio", "bioLink"]);
      if (!validInformation) {
        connection.release();
        return res.status(400).json({
          "data": -1,
          "message": "Not a valid request! Check API Schema!"
        });
      }

      let sql = `SELECT * FROM Accounts WHERE userId = ${accountId}`;
      connection.query(sql, (err, rows, fields) => {
        if (err) {
          connection.release();
          return couldNotConnect(res);
        }

        sql = `UPDATE Accounts SET bio = "${req.body.bio}", bioLink = "${req.body.bioLink}" WHERE userId = ${accountId}`;
        connection.query(sql, (err, rows, fields) => {
          if (err) {
            connection.release();
            return couldNotConnect(res);
          }

          connection.release();
          return res.status(200).json({
            "data": 0,
            "message": "Update successful!"
          });
        });
      })
    })
  });

  app.put('/accounts/:accountId/pinned', async (req, res) => {
    pool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        return couldNotConnect(res);
      }

      let accountId = typeof req.params.accountId === "string" ? parseInt(req.params.accountId) : req.params.accountId;
      let validInformation = requireBodyParams(req, ["pinnedPostId"]);
      if (!validInformation) {
        connection.release();
        return res.status(400).json({
          "data": -1,
          "message": "Not a valid request! Check API Schema!"
        });
      }

      let sql = `SELECT * FROM Accounts WHERE userId = ${accountId}`;
      connection.query(sql, (err, rows, fields) => {
        if (err) {
          connection.release();
          return couldNotConnect(res, err);
        }

        sql = `UPDATE Accounts SET pinnedPostId = "${req.body.pinnedPostId}" WHERE userId = ${accountId}`;
        connection.query(sql, (err, rows, fields) => {
          if (err) {
            connection.release();
            return couldNotConnect(res, err);
          }

          connection.release();
          return res.status(200).json({
            "data": 0,
            "message": "Update successful!"
          });
        });
      })
    })
  });

  app.put('/accounts/:accountId/private', async (req, res) => {
    pool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        return couldNotConnect(res);
      }

      let accountId = typeof req.params.accountId === "string" ? parseInt(req.params.accountId) : req.params.accountId;
      let validInformation = requireBodyParams(req, ["private"]);
      if (!validInformation) {
        connection.release();
        return res.status(400).json({
          "data": -1,
          "message": "Not a valid request! Check API Schema!"
        });
      }

      let sql = `SELECT * FROM Accounts WHERE userId = ${accountId}`;
      connection.query(sql, (err, rows, fields) => {
        if (err) {
          connection.release();
          return couldNotConnect(res);
        }

        sql = `UPDATE Accounts SET private = ${req.body.private} WHERE userId = ${accountId}`;
        connection.query(sql, (err, rows, fields) => {
          if (err) {
            connection.release();
            return couldNotConnect(res);
          }

          connection.release();
          return res.status(200).json({
            "data": 0,
            "message": "Update successful!"
          });
        });
      })
    })
  })

  //post a comment on a post
  app.post('/comments/comment', async (req, res) => {
    pool.getConnection(function (err, connection){

      // Try to connect to database, return an error if cannot
      if (err) {
        logger.error("Could not connect to the database!", err);
        return res.status(400).json({
          "data": -1,
          "message": "Could not connect to the database!"
        });
      }

      // Require a authorId, parentPostId, parentCommentId, comment, isRepost, and restricted in the req.body
      let validInformation = requireBodyParams(req, ["authorId", "parentPostId", "parentCommentId", "comment", "isRepost", "restricted"]);
      if (!validInformation) {
        connection.release();
        return res.status(200).json({

          "data": -1,
          "message": "Not a valid request! Check API Schema!"
        });
      }
      let {parameters, values} = getReqParamsFromBody(req);

      // Add comment to database
      console.log(parameters);
        let sql = `INSERT INTO Comments(${parameters.join(", ")})
                      VALUES(${values.join(", ")});`;
        if(values[3]==null){
          sql = `INSERT INTO Comments(${parameters.join(", ")})
                      VALUES(${values[0]},${values[1]},${values[2]},null,${values[4]},${values[5]});`;
        }

        console.log(sql);
      //throw an error if comment could not be added to database
      connection.query(sql, (err, rows, fields) => {
        if (err) {
          logger.error("Could not post the comment!", err);
          connection.release();
          return res.status(400).json({
            "data": -1,
            "message": "Failed to post the comment!"
          });
        }
        connection.release();
        logger.info(`Comment Posted!`);
        return res.status(200).json({
          "data": 0,
          "message": "Successfully posted comment!"
  
        });
      });

      //comment posted successfully
      
    });
  });

  //Get Comments from a post
  app.get('/comments/posts/:postId', async(req, res) => {
    pool.getConnection(function (err, connection){
      if (err) {
        logger.error("Could not connect to the database!", err);
        return res.status(400).json({
          "data": -1,
          "message": "Could not connect to the database!"
        });
      } else {
        let postId = typeof req.params.postId === "string" ? JSON.parse(req.params.postId) : req.params.postId;
        let sql = `SELECT c.*, a.username FROM Comments c INNER JOIN Accounts a on c.authorId = a.userId WHERE parentPostId = ${postId}`;

        connection.query(sql, function (err, rows, fields) {
          connection.release();
          if (err) {
            logger.error("Error while fetching values: \n", err);
            res.status(400).json({
              "data": -1,
              "error": "Error obtaining values"
            })
          } else {
            return res.status(200).json({
              "data": rows,
            });
          }
        });
      }
      return res;
    });
  });


  app.get('/accounts/:accountId', async(req, res) => {
    pool.getConnection((err, connection) => {
      if (err) {
        logger.error("Could not connect to the database!", err);
        return res.status(400).json({
          "data": -1,
          "message": "Could not connect to the database!"
        });
      }

      let validInformation = requireQueryParams(req, ["loggedInId"]);
      if (!validInformation) {
        connection.release();
        return res.status(200).json({
          "data": -1,
          "message": "Not a valid request! Need loggedInId in header!"
        });
      }

      let loggedInId = typeof req.query.loggedInId === "string" ? JSON.parse(req.query.loggedInId) : req.query.loggedInId;
      let accountId = typeof req.params.accountId === "string" ? JSON.parse(req.params.accountId) : req.params.accountId;
      let sql = `SELECT private FROM Accounts WHERE userId = "${accountId}"`;

      connection.query(sql, (err, rows, fields) => {
        if (err) {
          connection.release();
          logger.error("Could not connect to the database!", err);
          return res.status(400).json({
            "data": -1,
            "message": "Could not connect to the database!"
          });
        }

        let matched = rows.length > 0;
        if (!matched) {
          connection.release();
          logger.info(`Attempt to access account id #${accountId} which does not exist!`)
          return res.status(200).json({
            "data": [],
            "message": `No matching account with id ${accountId}!`
          })
        }

        let private = rows[0].private;

        if (loggedInId !== accountId && private) {
          sql = `SELECT firstName, lastName, username, userId ,profilePicture FROM Accounts WHERE userId = "${accountId}"`;
          connection.query(sql, (err, rows, fields) => {
            if (err) {
              connection.release();
              logger.error("Could not connect to the database!", err);
              return res.status(400).json({
                "data": -1,
                "message": "Could not connect to the database!"
              }); 
            }

            let returnValue = rows[0];
            sql = `SELECT followerId as userId, firstName, lastName, username FROM Followers
                    INNER JOIN Accounts
                    ON userId = followerId
                    WHERE leaderId = "${accountId}"`;
            connection.query(sql, (err, rows, fields) => {
              if (err) {
                returnValue.followers = 9;
                connection.release();
                logger.error("Could not connect to the database!", err);
                return res.status(400).json({
                  "data": -1,
                  "message": "Could not connect to the database!"
                }); 
              }

              returnValue.followers = rows;

              sql = `SELECT leaderId as userId, firstName, lastName, username FROM Followers
                      INNER JOIN Accounts
                      ON userId = leaderId
                      WHERE followerId = "${accountId}"`;
              connection.query(sql, (err, rows, fields) => {
                if (err) {
                  connection.release();
                  logger.error("Could not connect to the database!", err);
                  return res.status(400).json({
                    "data": -1,
                    "message": "Could not connect to the database!"
                  }); 
                }

                returnValue.following = rows;
                connection.release();
                return res.status(200).json({
                  "data": returnValue,
                  "message": "Returning data for account!"
                })
              })
            })
          });
        } else {
          sql = `SELECT firstName, lastName, bio, bioLink, username, userId, profilePicture FROM Accounts WHERE userId = "${accountId}"`;
          connection.query(sql, (err, rows, fields) => {
            if (err) {
              connection.release();
              logger.error("Could not connect to the database!", err);
              return res.status(400).json({
                "data": -1,
                "message": "Could not connect to the database!"
              }); 
            }

            let returnValue = rows[0];
            sql = `SELECT DISTINCT followerId as userId, firstName, lastName, username FROM Followers
                    INNER JOIN Accounts
                    ON userId = followerId
                    WHERE leaderId = "${accountId}"`;
            connection.query(sql, (err, rows, fields) => {
              if (err) {
                connection.release();
                logger.error("Could not connect to the database!", err);
                return res.status(400).json({
                  "data": -1,
                  "message": "Could not connect to the database!"
                }); 
              }

              returnValue.followers = rows;
              sql = `SELECT DISTINCT leaderId as userId, firstName, lastName, username FROM Followers
                      INNER JOIN Accounts
                      ON userId = leaderId
                      WHERE followerId = "${accountId}"`;
              connection.query(sql, (err, rows, fields) => {
                if (err) {
                  connection.release();
                  logger.error("Could not connect to the database!", err);
                  return res.status(400).json({
                    "data": -1,
                    "message": "Could not connect to the database!"
                  }); 
                }

                returnValue.following = rows;
                connection.release();
                return res.status(200).json({
                  "data": returnValue,
                  "message": "Returning data for account!"
                })
              })
            })
          })
        }
      });
    });
  })

  app.get('/posts/authors/:authorId', async(req, res) => {
    pool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        return couldNotConnect(res);
      }

      let authorId = typeof req.params.authorID === "string" ? parseInt(req.params.authorId) : req.params.authorId;
      let validInformation = requireQueryParams(req, ["loggedInId"]);
      if (!validInformation) {
        connection.release();
        return res.status(400).json({
          "data": -1,
          "message": "Not a valid request! Need to pass 'loggedInId' in URL!"
        });
      }

      let loggedInId = typeof req.query.loggedInId === "string" ? parseInt(req.query.loggedInId) : req.query.loggedInId;

      let sql = `SELECT private FROM Accounts WHERE userId = ${authorId}`;
      connection.query(sql, (err, rows, fields) => {
        if (err) {
          connection.release();
          return couldNotConnect(err, res);
        }

        if (rows.length === 0) {
          connection.release();
          return res.status(200).json({
            "data": [],
            "message": "No user found with that userId!"
          })
        }
        let private = rows[0].private;
        sql = `SELECT * FROM Followers WHERE leaderId = ${loggedInId} AND followerId = ${authorId}`;
        connection.query(sql, (err, rows, fields) => {
          if (err) {
            connection.release();
            return couldNotConnect(err, res);
          }

          let accessAuthorized = rows.length > 0;
          logger.info(loggedInId == authorId);
          if (!private || authorId == loggedInId || accessAuthorized) {
            sql = `SELECT * FROM Posts WHERE authorId = ${authorId}`;
            connection.query(sql, (err, rows, fields) => {
              if (err) {
                connection.release();
                return couldNotConnect(err, res);
              }

              connection.release();
              return res.status(200).json({
                "data": rows,
                "message": "Success!"
              });
            })
          } else {
            connection.release();
            return res.status(200).json({
              "data": [],
              "message": "This user is not authorized to access these posts!"
            });
          }
        });
      });
    });
  });
  app.put('/accounts/:accountId/profilePicture', (req, res) => {
    pool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        logger.error("Could not connect to the database!", err);
        return res.status(400).json({
          "data": -1,
          "message": "Could not connect to the database!"
        });
      }

      let validInformation = requireBodyParams(req, ["profilePicture"]);
      if (!validInformation) {
        connection.release();
        return res.status(400).json({
          "data": -1,
          "message": "Not a valid request! Need to pass 'profilePicture' in body!"
        });
      }
      
      let profilePicture = req.body.profilePicture;
      let sql = `UPDATE Accounts SET profilePicture = "${profilePicture}" WHERE userId = ${req.params.accountId}`;
      connection.query(sql, (err, rows, fields) => {
        connection.release();

        if (err) {
          logger.error("Could not connect to the database!", err);
          return res.status(400).json({
            "data": -1,
            "message": "Could not connect to the database!"
          });
        }

        return res.status(200).json({
          "data": rows,
          "message": "Successful!"
        });
      });
    });
  });
  app.post('/posts/post', postAPI("INSERT INTO Posts"));

  app.post('/reactions/reaction', postAPI("INSERT INTO Reactions"));         

  app.post('/followers/follow', postAPI("INSERT INTO Followers"));         

  app.delete('/followers/unfollow', (req, res) => {
    pool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        logger.error("Could not connect to the database!", err);
        return res.status(400).json({
          "data": -1,
          "message": "Could not connect to the database!"
        });
      }

      let validInformation = requireQueryParams(req, ["leaderId", "followerId"]);
      if (!validInformation) {
        connection.release();
        return res.status(400).json({
          "data": -1,
          "message": "Not a valid request! Need to pass 'leaderId' and 'followerId' in body!"
        });
      }
      
      let leaderId = req.query.leaderId;
      let followerId = req.query.followerId;
      let sql = `DELETE FROM Followers WHERE leaderId = ${leaderId} AND followerId = ${followerId}`;
      connection.query(sql, (err, rows, fields) => {
        if (err) {
          connection.release();
          logger.error("Could not connect to the database!", err);
          return res.status(400).json({
            "data": -1,
            "message": "Could not connect to the database!"
          });
        }

        connection.release();
        return res.status(200).json({
          "data": rows.affectedRows,
          "message": "Complete!"
        });
      });
    });
  });

  app.get('/posts', async(req, res) => {
    pool.getConnection(function (err, connection){
      if (err) {
        logger.error("Could not connect to the database!", err);
        return res.status(400).json({
          "data": -1,
          "message": "Could not connect to the database!"
        });
      } else {
        connection.query(`SELECT * FROM Posts`, function (err, rows, fields) {
          connection.release();
          if (err) {
            logger.error("Error while fetching values: \n", err);
            res.status(400).json({
              "data": [],
              "error": "Error obtaining values"
            })
          } else {
            res.status(200).json({
              "data": rows
            });
          }
        });
      }
    });
  });
  //Get Posts with Positive Reactions
  app.get('/posts/pos', async(req, res) => {
    pool.getConnection(function (err, connection){
      if (err) {
        logger.error("Could not connect to the database!", err);
        return res.status(400).json({
          "data": -1,
          "message": "Could not connect to the database!"
        });
      } else {
        connection.query(`SELECT postID FROM Posts AS a LEFT OUTER JOIN Reactions AS b 
        on a.postID=b.parentPostID 
        where b.isPositive=1`, function (err, rows, fields) {
          connection.release();
          if (err) {
            logger.error("Error while fetching values: \n", err);
            res.status(400).json({
              "data": [],
              "error": "Error obtaining values"
            })
          } else {
            res.status(200).json({
              "data": rows
            });
          }
        });
      }
    });
  });
  
  //Get Posts with Negative Reactions
  app.get('/posts/neg', async(req, res) => {
    pool.getConnection(function (err, connection){
      if (err) {
        logger.error("Could not connect to the database!", err);
        return res.status(400).json({
          "data": -1,
          "message": "Could not connect to the database!"
        });
      } else {
        connection.query(`SELECT postID FROM Posts AS a LEFT OUTER JOIN Reactions AS b 
        on a.postID=b.parentPostID 
        where b.isPositive=0`, function (err, rows, fields) {
          connection.release();
          if (err) {
            logger.error("Error while fetching values: \n", err);
            res.status(400).json({
              "data": [],
              "error": "Error obtaining values"
            })
          } else {
            res.status(200).json({
              "data": rows
            });
          }
        });
      }
    });

  }); 

  app.delete('/posts/:postId', (req, res) => {
    pool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        logger.error("Could not connect to the database!", err);
        return res.status(400).json({
          "data": -1,
          "message": "Could not connect to the database!"
        });
      }

      let postId = req.params.postId;
      let sql = `DELETE FROM Posts WHERE postId = ${postId}`;
      connection.query(sql, (err, rows, fields) => {
        if (err) {
          connection.release();
          logger.error("Could not connect to the database!", err);
          return res.status(400).json({
            "data": -1,
            "message": "Could not connect to the database!"
          });
        }

        connection.release();
        res.status(200).json({
          "data": rows.affectedRows,
          "message": "Complete!"
        });
      });
    });
  });

  app.delete('/comments/:commentId', (req, res) => {
    pool.getConnection((err, connection) => {
      if (err) {
        connection.release();
        logger.error("Could not connect to the database!", err);
        return res.status(400).json({
          "data": -1,
          "message": "Could not connect to the database!"
        });
      }

      let commentId = req.params.commentId;
      let sql = `DELETE FROM Comments WHERE postId = ${commentId}`;
      connection.query(sql, (err, rows, fields) => {
        if (err) {
          connection.release();
          logger.error("Could not connect to the database!", err);
          return res.status(400).json({
            "data": -1,
            "message": "Could not connect to the database!"
          });
        }

        connection.release();
        res.status(200).json({
          "data": rows.affectedRows,
          "message": "Complete!"
        });
      });
    }); 
  });
}

// Sends queries back, whether successful or failure
function handleQuery(err, result, res) {
  if (err) {
    res.end(JSON.stringify(err));
    return;
  }
  res.end(JSON.stringify(result));
}

// Used in dynamic API handlers so this doesn't have to be written out every time
let handleQueryStr = "(error, results, fields) => handleQuery(error, results, res)";

function getReqParamsFromBody(req) {
  // What we return
  let returnValue = {
    "parameters": [],
    "values": []
  };

  // For each loop tracking all parameters and their values
  for (let obj in req.body) {
    returnValue.parameters.push(obj);
    returnValue.values.push(typeof req.body[obj] === "string" ? `"${req.body[obj]}"` : req.body[obj]);
  }

  return returnValue;
}

// Returns whether req.param has all the given parameters
function requireQueryParams(req, params) {
  for (let i=0; i<params.length; i++) {
    if (typeof req.query[params[i]] === "undefined") return false;
  }

  return true;
}

// Returns whether req.body has all the given parameters
function requireBodyParams(req, params) {
  for (let i=0; i<params.length; i++) {
    if (typeof req.body[params[i]] === "undefined") return false;
  }

  return true;
}

function postAPI(query) {
  return eval(`
    async (req, res) => {
      pool.getConnection((err, connection) => {
        // Get all the passed parameters and values
        let {parameters, values} = getReqParamsFromBody(req);
        // Convert the arrays to comma-separated values to fit SQL syntax
        let sql = \`${query}
          (\${parameters.join(", ")})
          VALUES (\${values.join(", ")});\`;
        if (err) {
          logger.error("Could not connect to SQL Database!", err);
          res.end(err);
        } else {
          connection.query(sql, ${handleQueryStr});
        }
      });
    }
  `);
}

function couldNotConnect(err, res) {
  logger.error("Could not connect to the database!", err);
  return res.status(400).json({
    "data": -1,
    "message": "Could not connect to the database!"
  });
}