use crate::errors::{CustomContractError, CustomContractError::{Std, GameNotFound}};
use crate::random::get_random_game_id;
use crate::state::{calculate_winner, load_match_info, save_match_info, GameStatus, Player, RPSMatch, RPS, GameResult};
use cosmwasm_std::{Coin, DepsMut, Env, Event, MessageInfo, Response, StdError};

pub fn new_game(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    bet: Option<Coin>,
    name: String,
) -> Result<Response, CustomContractError> {
    let mut state = RPSMatch::default();

    let game = get_random_game_id(env);

    if let Some(some_bet) = bet {
        if !info.funds.contains(&some_bet) {
            return Err(Std(StdError::generic_err(
                "Sent funds do not match the proposed bet",
            )));
        }
        state.bet = Some(some_bet);
    }

    state.next();
    state.players[0] = Player::new(name, info.sender);
    state.players[1] = Player::default();

    save_match_info(deps.storage, &game, state)?;

    let resp = Response::new();

    let new_evt = Event::new("new_rps_game".to_string()).add_attribute_plaintext("game_code", game);

    Ok(resp.add_events(vec![new_evt]))
}

pub fn join_game(
    deps: DepsMut,
    info: MessageInfo,
    player_name: String,
    game_id: String,
) -> Result<Response, CustomContractError> {
    deps.api.debug(&format!(
        "Player 2 - {:?} is joining the game",
        &info.sender
    ));
    let state_result = load_match_info(deps.storage, &game_id);

    match state_result {
        Ok(mut state) => {
            if let Some(some_bet) = &state.bet {
                if !info.funds.contains(some_bet) {
                    return Err(Std(StdError::generic_err(
                        "Sent funds do not match the proposed bet",
                    )));
                }
            }

            if state.players[0].address() == &info.sender {
                return Err(Std(StdError::generic_err(
                    "You cannot play against yourself",
                    // Otherwise, "submit_choice" will always update the first player's choice,
                    // forever locking the bet. To unlock the bet, join with a second address
                )));
            }

            state.players[1] = Player::new(player_name, info.sender);
            state.next();

            deps.api
                .debug(&format!("Done. Current players: {:?}", &state.players));

            save_match_info(deps.storage, &game_id, state)?;

            Ok(Response::new())
        }
        _ => Err(GameNotFound),
    }
}

pub fn submit_choice(
    deps: DepsMut,
    info: MessageInfo,
    env: Env,
    game: String,
    choice: RPS,
) -> Result<Response, CustomContractError> {
    deps.api.debug(&format!(
        "Submitting choice {:?} for player {:?} ",
        &choice, &info.sender
    ));

    let mut state = load_match_info(deps.storage, &game)?;

    deps.api
        .debug(&format!("Current player info: {:?}", &state.players));

    match state.status {
        // can only submit a choice in specific states
        GameStatus::Started => {
            // Keep it empty
        }
        GameStatus::Got1stChoiceWaitingFor2nd => {
            // Fill it with the code below
        }
        _ => return Err(Std(StdError::generic_err("Cannot submit choice right now"))),
    }

    set_choice_for_player(info, choice, &mut state)?;
    deps.api
        .debug(&format!("Done. Current player info: {:?}", &state.players));

    // move state machine forwards
    state.next();

    if state.status == GameStatus::Done {
        state.meta.end_game_block = Some(env.block.height);

        if let (Some(p1), Some(p2)) = (&state.players[0].choice, &state.players[1].choice) {
            state.meta.winner = Some(calculate_winner(p1, p2));
            deps.api
                .debug(&format!("Winner is: {:?}", &state.meta.winner));
        } else {
            panic!("Got choices but they weren't saved")
        }
    }

    save_match_info(deps.storage, &game, state)?;

    Ok(Response::new())
}

// implement "vs computer" game mode
// pub fn play_vs_computer(
//     deps: DepsMut,
//     env: Env,
//     choice: RPS,
// ) -> Result<Response, CustomContractError> {
//
// }

fn set_choice_for_player(
    info: MessageInfo,
    choice: RPS,
    state: &mut RPSMatch,
) -> Result<(), CustomContractError> {
    if &info.sender == state.players[0].address() {
        state.players[0].choice = Some(choice);
        return Ok(());
    }

    if &info.sender == state.players[1].address() {
        state.players[1].choice = Some(choice);
        return Ok(());
    }

    Err(Std(StdError::generic_err("Sender is not in this game")))
}
