require("isomorphic-fetch");
require("es6-promise").polyfill();

const url = (api) => `http://localhost:4000${api}`;

describe("Backend tests:", () => {
  let sessionId;

  it("Register a new user named = testUser with password = 123", (done) => {
    let user = {
      username: "testUser",
      password: "123",
      email: "testUser@test.com",
      phone: "987-666-6969",
      zip: "77777",
      avatar: "https://image_testUser",
      dob: "1990/09/09",
    };

    fetch(url("/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    })
      .then((res) => res.json())
      .then((res) => {
        if (typeof res.createdUser === "undefined") {
          return done(new Error("Can't register because user already exists."));
        }
        expect(res.createdUser.username).toBe("testUser");
        expect(res.status).toBe("success!");

        done();
      });
  });

  it(`Log in as testUser`, (done) => {
    let user = { username: "testUser", password: "123" };
    fetch(url("/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    })
      .then((res) => {
        sessionId = res.headers.get("set-cookie").split(";")[0].split("=")[1];
        return res.json();
      })
      .then((res) => {
        //
        if (typeof res.loggedInUser === "undefined") {
          return done(new Error("Login failed."));
        }
        expect(res.status).toBe("success!");
        expect(res.loggedInUser.username).toBe("testUser");
        done();
      });
  });
  let createdPostId;

  it(`Create a new article and verify that the article was added (POST /article and GET /articles)`, (done) => {
    let newArticle = {
      text: "testing article for 'Create a new article and verify that the article was added'",
    };
    fetch(url("/article"), {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: sessionId },
      body: JSON.stringify(newArticle),
    })
      .then((res) => res.json())
      .then((res) => {
        if (!(res.status === "success!")) {
          done(new Error("Article creation failed."));
        }
        createdPostId = res.articles[0].pid;
      })
      .then(() => {
        fetch(url("/articles"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: sessionId,
          },
        })
          .then((res) => res.json())
          .then((res) => {
            if (!(res.status === "success!")) {
              return done(new Error("Cannot fetch articles from testUser."));
            }
            expect(res.articles.length).toBe(1);
            done();
          });
      });
  });

  it("Get articles from testUser (GET /articles/id, where id = username)", (done) => {
    fetch(url("/articles/testUser"), {
      method: "GET",
      headers: { "Content-Type": "application/json", authorization: sessionId },
    })
      .then((res) => res.json())
      .then((res) => {
        if (!(res.status === "success!")) {
          return done(new Error("Cannot fetch articles from testUser."));
        }
        expect(res.articles.length).toBe(1);
        done();
      });
  });

  it("Get an article with post id (GET /articles/id, where id = post id, which we just created)", (done) => {
    fetch(url(`/articles/${createdPostId}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        authorization: sessionId,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (!(res.status === "success!")) {
          return done(new Error("Cannot fetch the article with this pid."));
        }
        expect(res.articles.author).toBe("testUser");
        done();
      });
  });

  it("Update the status headline and verify the change (PUT & GET headline)", (done) => {
    let headline = {
      headline: "testing 123 headline",
    };
    fetch(url("/headline"), {
      method: "PUT",
      headers: { "Content-Type": "application/json", authorization: sessionId },
      body: JSON.stringify(headline),
    })
      .then((res) => res.json())
      .then((res) => {
        if (!(res.status === "success!")) {
          return done(new Error("Headline update failed."));
        }
      })
      .then(() => {
        fetch(url("/headline"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: sessionId,
          },
        })
          .then((res) => res.json())
          .then((res) => {
            if (res.message === "Could not find this user.") {
              return done(new Error("Headline fetching failed."));
            }
            expect(res.headline).toBe("testing 123 headline");
            done();
          });
      });
  });

  it("Log out testUser", (done) => {
    fetch(url("/logout"), {
      method: "PUT",
      headers: { "Content-Type": "application/json", authorization: sessionId },
    }).then((res) => {
      expect(res.status).toBe(200);
      done();
    });
  });

  it("clean up", (done) => {
    fetch(url("/delete/testUser"), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: "admin_passcode" }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.removedUser === "testUser") {
          done();
        } else {
          return done(new Error("clean up failed."));
        }
      });
  });
});
