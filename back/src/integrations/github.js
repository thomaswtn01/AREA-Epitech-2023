import APIs     from "apis";
import Bus      from "../bus.js";


//////////////////////////////////////
//  GITHUB
//////////////////////////////////////


export default {

    name        : "github",
    has_oauth   : true,
    disabled    : false,

    descriptor: {
        design: {
            label   : "Github",
            color   : "#000000",
            icon    : "/assets/img/services/github.svg",
        },
        triggers: [
            {
                name            : "on_github_repo_new_commit",
                description     : "Déclenché lorsqu'un commit est ajouté au repo.",
                require_auth    : true,
                params: {
                    in: [
                        {
                            name        : "repository",
                            type        : "string",
                            required    : true,
                        },
                    ],
                    out: [
                        {
                            name    : "REPO_NAME",
                            type    : "string",
                        },
                        {
                            name    : "REPO_URL",
                            type    : "string",
                        },
                        {
                            name    : "COMMIT_AUTHOR_NAME",
                            type    : "string",
                        },
                        {
                            name    : "COMMIT_AUTHOR_EMAIL",
                            type    : "string",
                        },
                        {
                            name    : "COMMIT_MESSAGE",
                            type    : "string",
                        },
                        {
                            name    : "COMMIT_URL",
                            type    : "string",
                        },
                    ],
                },
            },
            {
                name            : "on_github_repo_new_issue",
                description     : "Déclenché lorsqu'une issue est ouverte sur le repo.",
                require_auth    : true,
                params: {
                    in: [
                        {
                            name        : "repository",
                            type        : "string",
                            required    : true,
                        },
                    ],
                    out: [
                        {
                            name    : "REPO_NAME",
                            type    : "string",
                        },
                        {
                            name    : "REPO_URL",
                            type    : "string",
                        },
                        {
                            name    : "AUTHOR_NAME",
                            type    : "string",
                        },
                        {
                            name    : "AUTHOR_AVATAR_URL",
                            type    : "string",
                        },
                        {
                            name    : "ISSUE_TITLE",
                            type    : "string",
                        },
                        {
                            name    : "ISSUE_URL",
                            type    : "string",
                        },
                    ],
                },
            },
            {
                name            : "on_github_repo_new_pull_request",
                description     : "Déclenché lorsqu'une pull request est ajoutée au repo.",
                require_auth    : true,
                params: {
                    in: [
                        {
                            name        : "repository",
                            type        : "string",
                            required    : true,
                        },
                    ],
                    out: [
                        {
                            name    : "REPO_NAME",
                            type    : "string",
                        },
                        {
                            name    : "REPO_URL",
                            type    : "string",
                        },
                        {
                            name    : "AUTHOR_NAME",
                            type    : "string",
                        },
                        {
                            name    : "AUTHOR_AVATAR_URL",
                            type    : "string",
                        },
                        {
                            name    : "PULL_REQUEST_TITLE",
                            type    : "string",
                        },
                        {
                            name    : "PULL_REQUEST_URL",
                            type    : "string",
                        },
                    ],
                },
            },
        ],
        actions: [],
    },

    async onSetup() {
        function sortByRepository(reactions) {
            let result = new Map();

            for (let reaction of reactions) {
                let repositoryName = reaction.trigger.params.find((param) => param.name == "repository").value.toLowerCase();

                result.ensure(repositoryName, () => []).push(reaction);
            }

            return result;
        }

        setInterval((
            await Bus.buildActionCache(this.descriptor.triggers, {
                service         : this.name,
                require_auth    : true,

                async onRun(user, cached) {
                    let repositoryMap = sortByRepository(user.reactions);

                    // Set cache at first run.
                    if (cached == null)
                        cached = {
                            repositories    : new Map(),
                            news            : [],
                        };

                    // Clear latest events.
                    cached.news.length = 0;

                    // Get repositories last events.
                    for (let [ repository, reactions ] of repositoryMap.entries()) {
                        let cachedInfo = cached.repositories.ensure(repository, () => ({
                            last_polled_at  : 0,
                            etag            : null,
                        }));

                        try {
                            let res = await APIs.fetch("GET", `https://api.github.com/repos/${repository}/events`, {
                                headers: {
                                    "if-none-match"         : cachedInfo.etag,
                                    "User-Agent"            : "AREA",
                                    "Accept"                : "application/vnd.github+json",
                                    "Authorization"         : `Bearer ${user.application.access_token}`,
                                    "X-GitHub-Api-Version"  : "2022-11-28",
                                },
                            });

                            let events = res.json().filter((event) => Date.parse(event.created_at) >= cachedInfo.last_polled_at);

                            cachedInfo.last_polled_at   = Date.now();
                            cachedInfo.etag             = res.headers["etag"];

                            if (events.length)
                                cached.news.push({ repository, reactions, events });

                        } catch (err) {

                            // No more events.
                            if (err.code == 304) {
                                cachedInfo.events = [];
                                continue;
                            }

                            throw err;
                        }
                    }

                    return cached;
                },

                onCompare(cached) {
                    return cached.news.length
                        && cached.news;
                },

                async onChange(user, repositories) {
                    for (let { reactions, events } of repositories) {
                        for (let reaction of reactions) {
                            switch (reaction.trigger.name) {
                                case "on_github_repo_new_commit": {
                                    for (let event of events.filter((event) => event.type == "PushEvent")) {
                                        let commit = event.payload.commits[0];

                                        // We only want the latest distinct commit.
                                        if (commit.distinct)
                                            await Bus.trigger(user, reaction, {
                                                REPO_NAME               : event.repo.name,
                                                REPO_URL                : `https://github.com/${event.repo.name}`,
                                                COMMIT_AUTHOR_NAME      : commit.author.name,
                                                COMMIT_AUTHOR_EMAIL     : commit.author.email,
                                                COMMIT_MESSAGE          : commit.message,
                                                COMMIT_URL              : `https://github.com/${event.repo.name}/commit/${commit.sha}`,
                                            });
                                    }

                                    continue;
                                }

                                case "on_github_repo_new_issue": {
                                    for (let event of events.filter((event) => event.type == "IssuesEvent" && event.payload.action == "opened"))
                                        await Bus.trigger(user, reaction, {
                                            REPO_NAME                   : event.repo.name,
                                            REPO_URL                    : `https://github.com/${event.repo.name}`,
                                            AUTHOR_NAME                 : event.actor.display_login,
                                            AUTHOR_AVATAR_URL           : event.actor.avatar_url,
                                            ISSUE_TITLE                 : event.payload.issue.title,
                                            // @NOP : Prevent too long description.
                                            // ISSUE_DESCRIPTION           : event.payload.issue.body,
                                            ISSUE_URL                   : event.payload.issue.html_url,
                                        });

                                    continue;
                                }

                                case "on_github_repo_new_pull_request": {
                                    for (let event of events.filter((event) => event.type == "PullRequestEvent" && event.payload.action == "opened"))
                                        await Bus.trigger(user, reaction, {
                                            REPO_NAME                   : event.repo.name,
                                            REPO_URL                    : `https://github.com/${event.repo.name}`,
                                            AUTHOR_NAME                 : event.actor.display_login,
                                            AUTHOR_AVATAR_URL           : event.actor.avatar_url,
                                            PULL_REQUEST_TITLE          : event.payload.pull_request.title,
                                            // @NOP : Prevent too long description.
                                            // PULL_REQUEST_DESCRIPTION    : event.payload.pull_request.body,
                                            PULL_REQUEST_URL            : event.payload.pull_request.html_url,
                                        });

                                    continue;
                                }
                            }
                        }
                    }
                },
            })
        ), 10_000);
    },

    onOAuth(req, res) {
        if (req.method == "GET") {
            return res.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(Bus.getRedirectURI(req) + "/github")}&scope=repo&prompt=consent&state=${Bus.getRedirectState(req)}`);

        } else {
            return Bus.loginOAuth(req, res, {
                service : this.name,
                onAuth  : async (code) => {
                    let session = await APIs.fetch("POST", "https://github.com/login/oauth/access_token", {
                        headers: {
                            "Accept"                : "application/vnd.github+json",
                        },
                        json: {
                            client_id               : process.env.GITHUB_CLIENT_ID,
                            client_secret           : process.env.GITHUB_CLIENT_SECRET,
                            redirect_uri            : Bus.getRedirectURI(req) + "/github",
                            code,
                        },
                    })
                        .then(res => res.json());

                    // Checks whether an error has been returned.
                    if (session.error)
                        throw session;

                    let user = await APIs.fetch("GET", "https://api.github.com/user", {
                        headers: {
                            "User-Agent"            : "AREA",
                            "Accept"                : "application/vnd.github+json",
                            "Authorization"         : `Bearer ${session.access_token}`,
                            "X-GitHub-Api-Version"  : "2022-11-28",
                        },
                    })
                        .then(res => res.json());

                    return {
                        id              : user.id,
                        username        : user.login,
                        access_token    : session.access_token,
                        refresh_token   : session.refresh_token,
                    };
                },
            });
        }
    },

    async onRefresh(application) {
        // Github OAuth access tokens do not expire.
        // https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation#token-expired-due-to-lack-of-use
        // https://stackoverflow.com/questions/26902600/whats-the-lifetime-of-github-oauth-api-access-token

        return {
            access_token    : application.access_token,
            refresh_token   : application.refresh_token,
        };
    },
}
