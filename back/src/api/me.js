
//////////////////////////////////////
//  ROUTE : ME
//////////////////////////////////////


export default async function (req, res) {
    let user = await req.user.populate("applications triggers");

    // Send 200 OK.
    res.status(200).json({
        id          : user.id,
        username    : user.username,
        avatar      : user.avatar,
        applications: user.applications.map((app) => ({
            id          : app.id,
            service     : app.service,
            user_id     : app.user_id,
            user_name   : app.user_name,
            revoked     : app.revoked,
        })),
        triggers: user.triggers.map((config) => ({
            id      : config.id,
            trigger : config.trigger,
            actions : config.actions,
        })),
    });
}
