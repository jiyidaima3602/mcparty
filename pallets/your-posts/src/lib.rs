#[pallet]
pub mod pallet {
    #[pallet::storage]
    pub(super) type Posts<T: Config> = StorageMap<
        _,
        Blake2_128Concat,
        T::Hash,
        Post<T::AccountId, T::BlockNumber>,
    >;

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        #[pallet::weight(10_000)]
        pub fn create_post(
            origin: OriginFor<T>,
            content: Vec<u8>,
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            
            let post = Post {
                author: sender.clone(),
                content,
                created_at: <frame_system::Pallet<T>>::block_number(),
            };
            
            let hash = T::Hashing::hash_of(&post);
            Posts::<T>::insert(hash, post);
            
            Self::deposit_event(Event::PostCreated(sender, hash));
            Ok(())
        }
    }
} 