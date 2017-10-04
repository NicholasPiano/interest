var Shortcuts = {
	updateUser: function (id, role, status) {
		// 1. update in current_user_profile
		Context.set('active.user_profile.roles.{role}.status'.format({role: role}), status);

		// 2. update in clients
		Context.set('clients.{client}.users.{user}.roles.{role}.status'.format({
			client: Context.get('active.client'),
			user: id,
			role: role,
		}), status);
	}
};
